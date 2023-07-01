const vscode = require('vscode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class BookmarkDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        const categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const sortingOption = vscode.workspace.getConfiguration('extension-bookmarker').get('sortingOption', 'A-Z');

        if (element) {
            let bookmarksInCategory = bookmarks.filter(bookmark => bookmark.category === element.label);
            switch (sortingOption) {
                case 'A-Z':
                    bookmarksInCategory.sort((a, b) => a.displayName.localeCompare(b.displayName));
                    break;
                case 'Z-A':
                    bookmarksInCategory.sort((a, b) => b.displayName.localeCompare(a.displayName));
                    break;
                case 'New-Old':
                    bookmarksInCategory.sort((a, b) => b.dateAdded - a.dateAdded);
                    break;
                case 'Old-New':
                    bookmarksInCategory.sort((a, b) => a.dateAdded - b.dateAdded);
                    break;
            }
            return bookmarksInCategory.map(bookmark => {
                let treeItem = new vscode.TreeItem(bookmark.displayName);
                treeItem.command = {
                    command: 'extension-bookmarker.openExtension',
                    arguments: [bookmark.id],
                    title: 'Open Extension'
                };
                treeItem.contextValue = 'bookmarkedExtension';
                treeItem.iconPath = bookmark.icon ? vscode.Uri.parse(bookmark.icon) : new vscode.ThemeIcon('bookmark');
                return treeItem;
            });
        } else {
            return categories.map(category => {
                let treeItem = new vscode.TreeItem(category, vscode.TreeItemCollapsibleState.Collapsed);
                treeItem.contextValue = category === 'Default' ? 'defaultCategory' : 'category';
                return treeItem;
            });
        }
    }
}

function activate(context) {
    const bookmarkDataProvider = new BookmarkDataProvider();
    vscode.window.registerTreeDataProvider('extensionBookmarkerView', bookmarkDataProvider);

    // Command to select adding a bookmark, adding a category, search, import or export, filter, sort
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.add', async () => {
        const options = ['Add Bookmark', 'Add Category', 'Search Bookmark', 'Import Categories/Bookmarks', 'Export Categories/Bookmarks', 'Filter by Tag', 'Change Sorting Option'];
        const selectedOption = await vscode.window.showQuickPick(options, { placeHolder: 'Select an option' });
        if (selectedOption === options[0]) {
            vscode.commands.executeCommand('extension-bookmarker.addBookmark');
        } else if (selectedOption === options[1]) {
            vscode.commands.executeCommand('extension-bookmarker.addCategory');
        } else if (selectedOption === options[2]) {
            vscode.commands.executeCommand('extension-bookmarker.searchBookmark');
        } else if (selectedOption === options[3]) {
            vscode.commands.executeCommand('extension-bookmarker.importData');
        } else if (selectedOption === options[4]) {
            vscode.commands.executeCommand('extension-bookmarker.exportData');
        } else if (selectedOption === options[5]) {
            vscode.commands.executeCommand('extension-bookmarker.filterByTag');
        } else if (selectedOption === options[6]) {
            vscode.commands.executeCommand('extension-bookmarker.changeSortingOption');
        }
    }));

    // Command to add a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.addBookmark', async () => {
        const categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const selectedExtension = await vscode.window.showInputBox({ prompt: 'Enter the identifier of the extension (publisher.extensionname)' });
        const selectedCategory = await vscode.window.showQuickPick(categories, { placeHolder: 'Select a category for the bookmark' });

        if (selectedExtension && !bookmarks.find(bookmark => bookmark.id === selectedExtension)) {
            let [publisher, extensionName] = selectedExtension.split('.');
            try {
                let response = await axios.create().post('https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery', {
                    filters: [{
                        criteria: [
                            { filterType: 7, value: `${publisher}.${extensionName}` }
                        ]
                    }],
                    flags: 914
                }, {
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json;api-version=3.0-preview.1' }
                });

                if (response.data.results[0].extensions.length > 0) {
                    let extensionData = response.data.results[0].extensions[0];
                    let displayName = extensionData.displayName;
                    let icon = extensionData.versions[0].files.find(file => file.assetType === "Microsoft.VisualStudio.Services.Icons.Default")?.source;
                    bookmarks.push({ id: selectedExtension, displayName: displayName, icon: icon, category: selectedCategory, dateAdded: Date.now() });
                    await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                    bookmarkDataProvider.refresh();
                    vscode.window.showInformationMessage(`Extension ${selectedExtension} has been bookmarked.`);
                } else {
                    vscode.window.showErrorMessage(`Extension ${selectedExtension} not found.`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to add bookmark for ${selectedExtension}: ${error}`);
            }
        } else {
            vscode.window.showErrorMessage(`Bookmark ${selectedExtension} already exists.`);
        }
    }));

    // Command to view all bookmarks
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.viewBookmarks', async () => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const selectedBookmark = await vscode.window.showQuickPick(bookmarks.map(bookmark => bookmark.id), { placeHolder: 'Select a bookmark to view details' });
        if (selectedBookmark) {
            vscode.commands.executeCommand('workbench.extensions.search', selectedBookmark);
        }
    }));

    // Command to open a bookmarked extension in the Extensions view
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.openExtension', (extensionId) => {
        vscode.commands.executeCommand('workbench.extensions.search', extensionId);
    }));

    // Command to remove a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.removeBookmark', async (item) => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const bookmark = bookmarks.find(bookmark => bookmark.id === item.command.arguments[0]);
        if (bookmark) {
            const index = bookmarks.indexOf(bookmark);
            bookmarks.splice(index, 1);
            await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
            bookmarkDataProvider.refresh();
            vscode.window.showInformationMessage(`Bookmark ${item.label} has been removed.`);
        }
    }));

    // Command to add a category
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.addCategory', async () => {
        const categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const newCategory = await vscode.window.showInputBox({ prompt: 'Enter the name of the new category' });

        if (newCategory && !categories.includes(newCategory)) {
            categories.push(newCategory);
            await vscode.workspace.getConfiguration('extension-bookmarker').update('categories', categories, vscode.ConfigurationTarget.Global);
            bookmarkDataProvider.refresh();
            vscode.window.showInformationMessage(`Category ${newCategory} has been added.`);
        } else {
            vscode.window.showErrorMessage(`Category ${newCategory} already exists.`);
        }
    }));

    // Command to rename a category
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.renameCategory', async (item) => {
        const categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const newCategoryName = await vscode.window.showInputBox({ prompt: 'Enter the new name of the category', value: item.label });

        if (newCategoryName && !categories.includes(newCategoryName)) {
            const index = categories.indexOf(item.label);
            if (index > -1) {
                categories[index] = newCategoryName;
                bookmarks.forEach(bookmark => {
                    if (bookmark.category === item.label) {
                        bookmark.category = newCategoryName;
                    }
                });
                await vscode.workspace.getConfiguration('extension-bookmarker').update('categories', categories, vscode.ConfigurationTarget.Global);
                await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                bookmarkDataProvider.refresh();
                vscode.window.showInformationMessage(`Category ${item.label} has been renamed to ${newCategoryName}.`);
            }
        } else {
            vscode.window.showErrorMessage(`Category ${newCategoryName} already exists.`);
        }
    }));

    // Command to remove a category
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.removeCategory', async (item) => {
        const categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const index = categories.indexOf(item.label);
        if (index > -1) {
            categories.splice(index, 1);
            const bookmarksToReassign = bookmarks.filter(bookmark => bookmark.category === item.label);
            bookmarksToReassign.forEach(bookmark => {
                const bookmarkIndex = bookmarks.indexOf(bookmark);
                bookmarks[bookmarkIndex].category = "Default"; // Reassign the category to "Default"
            });
            await vscode.workspace.getConfiguration('extension-bookmarker').update('categories', categories, vscode.ConfigurationTarget.Global);
            await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
            bookmarkDataProvider.refresh();
            vscode.window.showInformationMessage(`Category ${item.label} has been removed and its bookmarks have been moved to the Default category.`);
        }
    }));

    // Command to move a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.moveBookmark', async (item) => {
        const categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const selectedCategory = await vscode.window.showQuickPick(categories, { placeHolder: 'Select a new category for the bookmark' });
        const bookmark = bookmarks.find(bookmark => bookmark.id === item.command.arguments[0]);
        if (bookmark) {
            bookmark.category = selectedCategory;
            await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
            bookmarkDataProvider.refresh();
            vscode.window.showInformationMessage(`Bookmark ${item.label} has been moved to ${selectedCategory}.`);
        }
    }));

    // Command to search a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.searchBookmark', async () => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const searchTerm = await vscode.window.showInputBox({ prompt: 'Enter the name of the bookmark to search' });

        if (searchTerm) {
            const searchResults = bookmarks.filter(bookmark => bookmark.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
            if (searchResults.length > 0) {
                vscode.window.showQuickPick(searchResults.map(bookmark => bookmark.displayName), { placeHolder: 'Select a bookmark to view details' })
                    .then(selectedBookmark => {
                        if (selectedBookmark) {
                            const selectedBookmarkId = searchResults.find(bookmark => bookmark.displayName === selectedBookmark).id;
                            vscode.commands.executeCommand('workbench.extensions.search', `${selectedBookmarkId}`);
                        }
                    });
            } else {
                vscode.window.showInformationMessage(`No bookmarks found with the term ${searchTerm}.`);
            }
        }
    }));

    // Command to add a tag to a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.addTag', async (item) => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const bookmark = bookmarks.find(bookmark => bookmark.id === item.command.arguments[0]);
        if (bookmark) {
            const newTag = await vscode.window.showInputBox({ prompt: 'Enter the name of the new tag' });
            if (newTag) {
                bookmark.tags = bookmark.tags || [];
                if (!bookmark.tags.includes(newTag)) {
                    bookmark.tags.push(newTag);
                    await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                    bookmarkDataProvider.refresh();
                    vscode.window.showInformationMessage(`Tag ${newTag} has been added to ${item.label}.`);
                } else {
                    vscode.window.showErrorMessage(`Tag ${newTag} already exists for ${item.label}.`);
                }
            }
        }
    }));

    // Command to remove a tag from a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.removeTag', async (item) => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const bookmark = bookmarks.find(bookmark => bookmark.id === item.command.arguments[0]);
        if (bookmark && bookmark.tags) {
            const selectedTag = await vscode.window.showQuickPick(bookmark.tags, { placeHolder: 'Select a tag to remove' });
            if (selectedTag) {
                const index = bookmark.tags.indexOf(selectedTag);
                bookmark.tags.splice(index, 1);
                await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                bookmarkDataProvider.refresh();
                vscode.window.showInformationMessage(`Tag ${selectedTag} has been removed from ${item.label}.`);
            }
        }
    }));

    // Command to filter bookmarks by tag
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.filterByTag', async () => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const allTags = [...new Set(bookmarks.flatMap(bookmark => bookmark.tags || []))];
        const selectedTag = await vscode.window.showQuickPick(allTags, { placeHolder: 'Select a tag to filter by' });
        if (selectedTag) {
            const filteredBookmarks = bookmarks.filter(bookmark => bookmark.tags && bookmark.tags.includes(selectedTag));
            vscode.window.showQuickPick(filteredBookmarks.map(bookmark => bookmark.displayName), { placeHolder: 'Select a bookmark to view details' })
                .then(selectedBookmark => {
                    if (selectedBookmark) {
                        const selectedBookmarkId = filteredBookmarks.find(bookmark => bookmark.displayName === selectedBookmark).id;
                        vscode.commands.executeCommand('workbench.extensions.search', `${selectedBookmarkId}`);
                    }
                });
        }
    }));

    // Command to change the sorting option
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.changeSortingOption', async () => {
        const options = ['A-Z', 'Z-A', 'New-Old', 'Old-New'];
        const selectedOption = await vscode.window.showQuickPick(options, { placeHolder: 'Select a sorting option' });
        if (selectedOption) {
            await vscode.workspace.getConfiguration('extension-bookmarker').update('sortingOption', selectedOption, vscode.ConfigurationTarget.Global);
            bookmarkDataProvider.refresh();
            vscode.window.showInformationMessage(`Sorting option has been changed to ${selectedOption}.`);
        }
    }));

    // Command to import categories/bookmarks
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.importData', async () => {
        const filePath = await vscode.window.showOpenDialog({ defaultUri: vscode.Uri.file(vscode.workspace.rootPath), canSelectMany: false, filters: { 'JSON': ['json'] } });
        if (filePath && filePath[0]) {
            fs.readFile(filePath[0].fsPath, (err, data) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to import data: ${err}`);
                } else {
                    try {
                        const { categories: importedCategories, bookmarks: importedBookmarks } = JSON.parse(data);
                        const existingCategories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
                        const existingBookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);

                        // Merge categories and bookmarks, removing duplicates
                        const mergedCategories = [...new Set([...existingCategories, ...importedCategories])];
                        const mergedBookmarks = [...existingBookmarks, ...importedBookmarks.filter((importedBookmark) =>
                            !existingBookmarks.some(existingBookmark => existingBookmark.id === importedBookmark.id)
                        )];

                        Promise.all([
                            vscode.workspace.getConfiguration('extension-bookmarker').update('categories', mergedCategories, vscode.ConfigurationTarget.Global),
                            vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', mergedBookmarks, vscode.ConfigurationTarget.Global)
                        ]).then(() => {
                            bookmarkDataProvider.refresh(); // Refresh the data provider
                            vscode.window.showInformationMessage(`Data has been imported from ${filePath[0].fsPath}`);
                        }).catch(err => {
                            vscode.window.showErrorMessage(`Failed to update data: ${err}`);
                        });
                    } catch (err) {
                        vscode.window.showErrorMessage(`Failed to parse data: ${err}`);
                    }
                }
            });
        }
    }));

    // Command to export categories/bookmarks
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.exportData', async () => {
        const categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const data = { categories, bookmarks };
        const filePath = await vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath, 'bookmarker-data.json')) });
        if (filePath) {
            fs.writeFile(filePath.fsPath, JSON.stringify(data, null, 2), (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to export data: ${err}`);
                } else {
                    vscode.window.showInformationMessage(`Data has been exported to ${filePath.fsPath}`);
                }
            });
        }
    }));

    // Command to remove all data
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.removeAllData', async () => {
        await vscode.workspace.getConfiguration('extension-bookmarker').update('categories', ["Default"], vscode.ConfigurationTarget.Global);
        await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', [], vscode.ConfigurationTarget.Global);
        bookmarkDataProvider.refresh();
        vscode.window.showInformationMessage(`All data has been removed.`);
    }));
}

// This method is called when the extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
