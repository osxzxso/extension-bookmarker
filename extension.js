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
                    bookmarksInCategory.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                    break;
                case 'Old-New':
                    bookmarksInCategory.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
                    break;
            }
            return bookmarksInCategory.map(bookmark => {
                let treeItem = new vscode.TreeItem(bookmark.displayName);
                let details = `ID: ${bookmark.id}\nName: ${bookmark.displayName}\nCategory: ${bookmark.category}`;
                if (bookmark.tags && bookmark.tags.length > 0) {
                    details += `\nTags: ${bookmark.tags.sort().join(', ')}`; // Sort tags A-Z
                }
                details += `\nAdded: ${bookmark.dateAdded}\n\nDownloads: ${bookmark.downloadCount}\nRating: ${bookmark.rating}\nUpdated: ${bookmark.lastUpdate}`;
                if (bookmark.note) {
                    details += `\n\nNote: ${bookmark.note}`;
                }
                treeItem.tooltip = details;
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
            // Sort categories alphabetically, but keep 'Default' at the top
            const sortedCategories = categories.sort((a, b) => {
                if (a === 'Default') return -1;
                if (b === 'Default') return 1;
                return a.localeCompare(b);
            });

            return sortedCategories.map(category => {
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

    // Initialize categories if not already initialized
    let categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
    if (!Array.isArray(categories)) {
        vscode.workspace.getConfiguration('extension-bookmarker').update('categories', [], vscode.ConfigurationTarget.Global);
    }

    // Initialize tags if not already initialized
    let tags = vscode.workspace.getConfiguration('extension-bookmarker').get('tags', []);
    if (!Array.isArray(tags)) {
        vscode.workspace.getConfiguration('extension-bookmarker').update('tags', [], vscode.ConfigurationTarget.Global);
    }

    // Command to select adding a bookmark, adding a category, search, import or export, filter, sort, remove all data
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.add', async () => {
        const options = ['Add Bookmark', 'Add Category', 'Add Tag', 'Rename Tag', 'Remove Tag', 'Sort Bookmarks', 'Filter Bookmarks', 'Import Data', 'Export Data', 'Remove All Data'];
        const selectedOption = await vscode.window.showQuickPick(options, { placeHolder: 'Select an option' });
        if (selectedOption === options[0]) {
            vscode.commands.executeCommand('extension-bookmarker.addBookmark');
        } else if (selectedOption === options[1]) {
            vscode.commands.executeCommand('extension-bookmarker.addCategory');
        } else if (selectedOption === options[2]) {
            vscode.commands.executeCommand('extension-bookmarker.addTagToList');
        } else if (selectedOption === options[3]) {
            vscode.commands.executeCommand('extension-bookmarker.renameTagInList');
        } else if (selectedOption === options[4]) {
            vscode.commands.executeCommand('extension-bookmarker.removeTagFromList');
        } else if (selectedOption === options[5]) {
            vscode.commands.executeCommand('extension-bookmarker.sortBookmarks');
        } else if (selectedOption === options[6]) {
            vscode.commands.executeCommand('extension-bookmarker.filterByTag');
        } else if (selectedOption === options[7]) {
            vscode.commands.executeCommand('extension-bookmarker.importData');
        } else if (selectedOption === options[8]) {
            vscode.commands.executeCommand('extension-bookmarker.exportData');
        } else if (selectedOption === options[9]) {
            vscode.commands.executeCommand('extension-bookmarker.removeAllData');
        }
    }));

    // Command to add a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.addBookmark', async () => {
        const categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const selectedExtension = await vscode.window.showInputBox({ prompt: 'Enter the identifier of the extension (publisher.extensionname)' });

        if (selectedExtension && selectedExtension.trim() !== '' && !bookmarks.find(bookmark => bookmark.id === selectedExtension)) {
            // Sort categories alphabetically, but keep 'Default' at the top
            const sortedCategories = categories.sort((a, b) => {
                if (a === 'Default') return -1;
                if (b === 'Default') return 1;
                return a.localeCompare(b);
            });
            const selectedCategory = await vscode.window.showQuickPick(sortedCategories, { placeHolder: 'Select a category for the bookmark' });

            if (selectedCategory) {
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
                        let downloadCount = extensionData.statistics.find(stat => stat.statisticName === "install")?.value;
                        let rating = extensionData.statistics.find(stat => stat.statisticName === "averagerating")?.value;
                        let dateAdded = new Date().toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
                        let lastUpdate = new Date(extensionData.versions[0].lastUpdated).toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
                        downloadCount = downloadCount.toLocaleString();
                        rating = rating.toFixed(1);
                        bookmarks.push({ id: selectedExtension, displayName: displayName, icon: icon, category: selectedCategory, dateAdded: dateAdded, downloadCount: downloadCount, rating: rating, lastUpdate: lastUpdate });
                        await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                        bookmarkDataProvider.refresh();
                        vscode.window.showInformationMessage(`Extension ${selectedExtension} has been bookmarked.`);
                    } else {
                        vscode.window.showErrorMessage(`Extension ${selectedExtension} not found.`);
                    }
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to add bookmark for ${selectedExtension}: ${error}`);
                }
            }
        } else if (selectedExtension && selectedExtension.trim() !== '') {
            vscode.window.showErrorMessage(`Bookmark ${selectedExtension} already exists.`);
        }
    }));

    // Command to view all bookmarks
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.viewBookmarks', async () => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const sortedBookmarks = bookmarks.sort((a, b) => a.displayName.localeCompare(b.displayName));
        const selectedBookmark = await vscode.window.showQuickPick(sortedBookmarks.map(bookmark => bookmark.displayName), { placeHolder: 'Select a bookmark to view details' });
        if (selectedBookmark) {
            const selectedBookmarkId = sortedBookmarks.find(bookmark => bookmark.displayName === selectedBookmark).id;
            vscode.commands.executeCommand('workbench.extensions.search', selectedBookmarkId);
        }
    }));

    // Command to open a bookmarked extension in the Extensions view
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.openExtension', (extensionId) => {
        vscode.commands.executeCommand('workbench.extensions.search', extensionId);
    }));

    // Command to remove a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.removeBookmark', async (item) => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        let bookmark;
        if (item) {
            bookmark = bookmarks.find(bookmark => bookmark.id === item.command.arguments[0]);
        } else {
            const sortedBookmarks = bookmarks.sort((a, b) => a.displayName.localeCompare(b.displayName));
            const selectedBookmark = await vscode.window.showQuickPick(sortedBookmarks.map(bookmark => bookmark.displayName), { placeHolder: 'Select a bookmark to remove' });
            bookmark = bookmarks.find(bookmark => bookmark.displayName === selectedBookmark);
        }
        if (bookmark) {
            const index = bookmarks.indexOf(bookmark);
            bookmarks.splice(index, 1);
            await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
            bookmarkDataProvider.refresh();
            vscode.window.showInformationMessage(`Bookmark ${bookmark.displayName} has been removed.`);
        }
    }));

    // Command to add a category
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.addCategory', async () => {
        const categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = categories.sort().map(category => ({ label: category }));
        quickPick.placeholder = 'Enter a new category';
        quickPick.onDidChangeValue(value => {
            if (value && !categories.map(category => category.toLowerCase()).includes(value.toLowerCase())) {
                quickPick.items = [{ label: value }, ...categories.sort().map(category => ({ label: category }))];
            } else {
                quickPick.items = categories.sort((a, b) => {
                    if (a === 'Default') return -1;
                    if (b === 'Default') return 1;
                    return a.localeCompare(b);
                }).map(category => ({ label: category }));
            }
        });
        quickPick.onDidAccept(async () => {
            const newCategory = quickPick.value;
            if (newCategory && newCategory.trim() !== '' && !categories.map(category => category.toLowerCase()).includes(newCategory.toLowerCase())) {
                categories.push(newCategory);
                await vscode.workspace.getConfiguration('extension-bookmarker').update('categories', categories, vscode.ConfigurationTarget.Global);
                bookmarkDataProvider.refresh();
                vscode.window.showInformationMessage(`Category ${newCategory} has been added.`);
            } else if (newCategory && newCategory.trim() !== '') {
                vscode.window.showErrorMessage(`Category ${newCategory} already exists.`);
            }
            quickPick.hide();
        });
        quickPick.show();
    }));

    // Command to rename a category
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.renameCategory', async (item) => {
        let categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        let selectedCategory;

        // Sort categories alphabetically, but keep 'Default' at the top
        categories = categories.sort((a, b) => {
            if (a === 'Default') return -1;
            if (b === 'Default') return 1;
            return a.localeCompare(b);
        });

        if (item) {
            selectedCategory = item.label;
        } else {
            selectedCategory = await vscode.window.showQuickPick(categories, { placeHolder: 'Select a category to rename' });
        }

        if (selectedCategory) {
            const quickPick = vscode.window.createQuickPick();
            quickPick.items = categories.map(category => ({ label: category }));
            quickPick.value = selectedCategory;
            quickPick.placeholder = 'Enter the new name of the category';
            quickPick.onDidChangeValue(value => {
                if (value && !categories.filter(category => category.toLowerCase() !== selectedCategory.toLowerCase()).map(category => category.toLowerCase()).includes(value.toLowerCase())) {
                    quickPick.items = [{ label: value }, ...categories.map(category => ({ label: category }))];
                } else {
                    quickPick.items = categories.map(category => ({ label: category }));
                }
            });
            quickPick.onDidAccept(async () => {
                const newCategoryName = quickPick.value;
                if (newCategoryName && newCategoryName.trim() !== '' && newCategoryName !== selectedCategory && (!categories.filter(category => category.toLowerCase() !== selectedCategory.toLowerCase()).map(category => category.toLowerCase()).includes(newCategoryName.toLowerCase()))) {
                    const index = categories.indexOf(selectedCategory);
                    if (index > -1) {
                        categories[index] = newCategoryName;
                        bookmarks.forEach(bookmark => {
                            if (bookmark.category === selectedCategory) {
                                bookmark.category = newCategoryName;
                            }
                        });
                        await vscode.workspace.getConfiguration('extension-bookmarker').update('categories', categories, vscode.ConfigurationTarget.Global);
                        await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                        bookmarkDataProvider.refresh();
                        vscode.window.showInformationMessage(`Category ${selectedCategory} has been renamed to ${newCategoryName}.`);
                    }
                } else if (newCategoryName && newCategoryName.trim() !== '') {
                    if (newCategoryName === selectedCategory) {
                        vscode.window.showErrorMessage(`New category name cannot be the same as the old name.`);
                    } else {
                        vscode.window.showErrorMessage(`Category ${newCategoryName} already exists.`);
                    }
                }
                quickPick.hide();
            });
            quickPick.show();
        }
    }));

    // Command to remove a category
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.removeCategory', async (item) => {
        const categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        let selectedCategory;

        // Sort categories alphabetically, but keep 'Default' at the top
        const sortedCategories = categories.sort((a, b) => {
            if (a === 'Default') return -1;
            if (b === 'Default') return 1;
            return a.localeCompare(b);
        });

        if (item) {
            selectedCategory = item.label;
        } else {
            selectedCategory = await vscode.window.showQuickPick(sortedCategories, { placeHolder: 'Select a category to remove' });
        }

        if (selectedCategory) {
            const index = categories.indexOf(selectedCategory);
            if (index > -1) {
                categories.splice(index, 1);
                const bookmarksToReassign = bookmarks.filter(bookmark => bookmark.category === selectedCategory);
                bookmarksToReassign.forEach(bookmark => {
                    const bookmarkIndex = bookmarks.indexOf(bookmark);
                    bookmarks[bookmarkIndex].category = "Default"; // Reassign the category to "Default"
                });
                await vscode.workspace.getConfiguration('extension-bookmarker').update('categories', categories, vscode.ConfigurationTarget.Global);
                await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                bookmarkDataProvider.refresh();
                if (bookmarksToReassign.length > 0) {
                    vscode.window.showInformationMessage(`Category ${selectedCategory} has been removed and its bookmarks have been moved to the Default category.`);
                } else {
                    vscode.window.showInformationMessage(`Category ${selectedCategory} has been removed.`);
                }
            }
        }
    }));

    // Command to move a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.moveBookmark', async (item) => {
        const categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        let bookmark;
        if (item) {
            bookmark = bookmarks.find(bookmark => bookmark.id === item.command.arguments[0]);
        } else {
            const selectedBookmark = await vscode.window.showQuickPick(bookmarks.map(bookmark => bookmark.displayName), { placeHolder: 'Select a bookmark to move' });
            bookmark = bookmarks.find(bookmark => bookmark.displayName === selectedBookmark);
        }
        if (bookmark) {
            // Sort categories alphabetically, but keep 'Default' at the top
            const sortedCategories = categories.sort((a, b) => {
                if (a === 'Default') return -1;
                if (b === 'Default') return 1;
                return a.localeCompare(b);
            }).filter(category => category !== bookmark.category); // Exclude current category of the bookmark
            // Check if there are any categories other than the current category of the bookmark
            if (sortedCategories.length < 1) {
                vscode.window.showInformationMessage(`There are no other categories to move ${bookmark.displayName} to.`);
                return;
            }
            const selectedCategory = await vscode.window.showQuickPick(sortedCategories, { placeHolder: 'Select a new category for the bookmark' });
            if (selectedCategory) {
                bookmark.category = selectedCategory;
                await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                bookmarkDataProvider.refresh();
                vscode.window.showInformationMessage(`Bookmark ${bookmark.displayName} has been moved to ${selectedCategory}.`);
            }
        }
    }));

    // Command to search bookmarks
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.searchBookmarks', async () => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = bookmarks.sort((a, b) => a.displayName.localeCompare(b.displayName)).map(bookmark => ({ label: bookmark.displayName }));
        quickPick.placeholder = 'Enter a bookmark name or select an existing one';
        quickPick.onDidChangeValue(value => {
            if (value) {
                quickPick.items = bookmarks.filter(bookmark => bookmark.displayName.toLowerCase().includes(value.toLowerCase()))
                    .sort((a, b) => a.displayName.localeCompare(b.displayName))
                    .map(bookmark => ({ label: bookmark.displayName }));
            } else {
                quickPick.items = bookmarks.sort((a, b) => a.displayName.localeCompare(b.displayName)).map(bookmark => ({ label: bookmark.displayName }));
            }
        });
        quickPick.onDidAccept(() => {
            const selectedBookmark = quickPick.selectedItems[0];
            if (selectedBookmark) {
                const selectedBookmarkId = bookmarks.find(bookmark => bookmark.displayName === selectedBookmark.label).id;
                vscode.commands.executeCommand('workbench.extensions.search', `${selectedBookmarkId}`);
            }
            quickPick.hide();
        });
        quickPick.show();
    }));

    // Command to add a tag to list
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.addTagToList', async () => {
        const tags = vscode.workspace.getConfiguration('extension-bookmarker').get('tags', []);
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = tags.sort().map(tag => ({ label: tag }));
        quickPick.placeholder = 'Enter a new tag';
        quickPick.onDidChangeValue(value => {
            if (value && !tags.includes(value.toLowerCase())) {
                quickPick.items = [{ label: value }, ...tags.sort().map(tag => ({ label: tag }))];
            } else {
                quickPick.items = tags.sort().map(tag => ({ label: tag }));
            }
        });
        quickPick.onDidAccept(() => {
            const newTag = quickPick.value;
            if (newTag && newTag.trim() !== '' && !tags.includes(newTag.toLowerCase())) {
                tags.push(newTag.toLowerCase());
                vscode.workspace.getConfiguration('extension-bookmarker').update('tags', tags, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Tag ${newTag} has been added.`);
            } else if (newTag && newTag.trim() !== '') {
                vscode.window.showErrorMessage(`Tag ${newTag} already exists.`);
            }
            quickPick.hide();
        });
        quickPick.show();
    }));

    // Command to rename a tag in the list
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.renameTagInList', async () => {
        const tags = vscode.workspace.getConfiguration('extension-bookmarker').get('tags', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        if (tags.length > 0) {
            const selectedTagToRename = await vscode.window.showQuickPick(tags.sort(), { placeHolder: 'Select a tag to rename' });
            if (selectedTagToRename) {
                const quickPick = vscode.window.createQuickPick();
                quickPick.items = tags.map(tag => ({ label: tag }));
                quickPick.value = selectedTagToRename;
                quickPick.placeholder = 'Enter a new name for the tag';
                quickPick.onDidChangeValue(value => {
                    if (value && !tags.map(tag => tag.toLowerCase()).includes(value.toLowerCase())) {
                        quickPick.items = [{ label: value }, ...tags.map(tag => ({ label: tag }))];
                    } else {
                        quickPick.items = tags.map(tag => ({ label: tag }));
                    }
                });
                quickPick.onDidAccept(async () => {
                    const newTagName = quickPick.value;
                    if (newTagName && newTagName.trim() !== '' && !tags.map(tag => tag.toLowerCase()).includes(newTagName.toLowerCase())) {
                        const index = tags.indexOf(selectedTagToRename);
                        if (index > -1) {
                            tags[index] = newTagName.toLowerCase();
                            bookmarks.forEach(bookmark => {
                                if (bookmark.tags) {
                                    const tagIndex = bookmark.tags.indexOf(selectedTagToRename);
                                    if (tagIndex > -1) {
                                        bookmark.tags[tagIndex] = newTagName.toLowerCase();
                                    }
                                }
                            });
                            await vscode.workspace.getConfiguration('extension-bookmarker').update('tags', tags, vscode.ConfigurationTarget.Global);
                            await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                            bookmarkDataProvider.refresh(); // Refresh the TreeView
                            vscode.window.showInformationMessage(`Tag ${selectedTagToRename} has been renamed to ${newTagName}.`);
                        }
                    } else if (newTagName && newTagName.trim() !== '') {
                        vscode.window.showErrorMessage(`Tag ${newTagName} already exists.`);
                    }
                    quickPick.hide();
                });
                quickPick.show();
            }
        } else {
            vscode.window.showInformationMessage(`There are no tags in the list.`);
        }
    }));

    // Command to remove a tag from list
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.removeTagFromList', async () => {
        const tags = vscode.workspace.getConfiguration('extension-bookmarker').get('tags', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        if (tags.length > 0) {
            // Sort the tags in A-Z order
            const sortedTags = tags.sort();
            const selectedTagToRemove = await vscode.window.showQuickPick(sortedTags, { placeHolder: 'Select a tag to remove' });
            if (selectedTagToRemove) {
                const index = sortedTags.indexOf(selectedTagToRemove);
                if (index > -1) {
                    sortedTags.splice(index, 1);
                    bookmarks.forEach(bookmark => {
                        if (bookmark.tags) {
                            const tagIndex = bookmark.tags.indexOf(selectedTagToRemove);
                            if (tagIndex > -1) {
                                bookmark.tags.splice(tagIndex, 1);
                            }
                        }
                    });
                    await vscode.workspace.getConfiguration('extension-bookmarker').update('tags', sortedTags, vscode.ConfigurationTarget.Global);
                    await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                    bookmarkDataProvider.refresh(); // Refresh the TreeView
                    vscode.window.showInformationMessage(`Tag ${selectedTagToRemove} has been removed.`);
                }
            }
        } else {
            vscode.window.showInformationMessage(`There are no tags in the list.`);
        }
    }));

    // Command to add a tag to a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.addTagToBookmark', async (item) => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const tags = vscode.workspace.getConfiguration('extension-bookmarker').get('tags', []);
        let bookmark;
        if (item) {
            bookmark = bookmarks.find(bookmark => bookmark.id === item.command.arguments[0]);
        } else {
            const sortedBookmarks = bookmarks.sort((a, b) => a.displayName.localeCompare(b.displayName)); // Sort bookmarks A-Z
            const selectedBookmark = await vscode.window.showQuickPick(sortedBookmarks.map(bookmark => bookmark.displayName), { placeHolder: 'Select a bookmark to add a tag' });
            bookmark = bookmarks.find(bookmark => bookmark.displayName === selectedBookmark);
        }
        if (bookmark) {
            bookmark.tags = bookmark.tags || [];
            const availableTags = tags.filter(tag => !bookmark.tags.includes(tag)).sort(); // Exclude tags that are already added to the bookmark and sort them
            if (availableTags.length > 0) {
                const selectedTag = await vscode.window.showQuickPick(availableTags, { placeHolder: 'Select a tag to add' });
                if (selectedTag) {
                    bookmark.tags.push(selectedTag);
                    await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                    bookmarkDataProvider.refresh(); // Refresh the TreeView
                    vscode.window.showInformationMessage(`Tag ${selectedTag} has been added to ${bookmark.displayName}.`);
                }
            } else {
                if (tags.length === 0) {
                    vscode.window.showInformationMessage(`No tags available to add to ${bookmark.displayName}.`);
                } else {
                    vscode.window.showInformationMessage(`All tags are already added to ${bookmark.displayName}.`);
                }
            }
        }
    }));

    // Command to remove a tag from a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.removeTagFromBookmark', async (item) => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        let bookmark;
        if (item) {
            bookmark = bookmarks.find(bookmark => bookmark.id === item.command.arguments[0]);
        } else {
            const sortedBookmarks = bookmarks.sort((a, b) => a.displayName.localeCompare(b.displayName)); // Sort bookmarks A-Z
            const selectedBookmark = await vscode.window.showQuickPick(sortedBookmarks.map(bookmark => bookmark.displayName), { placeHolder: 'Select a bookmark to remove a tag' });
            bookmark = bookmarks.find(bookmark => bookmark.displayName === selectedBookmark);
        }
        if (bookmark && bookmark.tags && bookmark.tags.length > 0) {
            const sortedTags = bookmark.tags.sort(); // Sort tags A-Z
            const selectedTag = await vscode.window.showQuickPick(sortedTags, { placeHolder: 'Select a tag to remove' });
            if (selectedTag) {
                const index = bookmark.tags.indexOf(selectedTag);
                bookmark.tags.splice(index, 1);
                await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                bookmarkDataProvider.refresh(); // Refresh the TreeView
                vscode.window.showInformationMessage(`Tag ${selectedTag} has been removed from ${bookmark.displayName}.`);
            }
        } else {
            vscode.window.showInformationMessage(`Bookmark ${bookmark.displayName} does not have any tags.`);
        }
    }));

    // Command to filter bookmarks by tag
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.filterByTag', async () => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const allTags = [...new Set(bookmarks.flatMap(bookmark => bookmark.tags || []))];
        const sortedTags = allTags.sort((a, b) => a.localeCompare(b));

        if (allTags.length === 0) {
            vscode.window.showInformationMessage('No tags found.');
            return;
        }

        const selectedTag = await vscode.window.showQuickPick(sortedTags, { placeHolder: 'Select a tag to filter by' });
        if (selectedTag) {
            const filteredBookmarks = bookmarks.filter(bookmark => bookmark.tags && bookmark.tags.includes(selectedTag));
            const sortedFilteredBookmarks = filteredBookmarks.sort((a, b) => a.displayName.localeCompare(b.displayName));
            vscode.window.showQuickPick(sortedFilteredBookmarks.map(bookmark => bookmark.displayName), { placeHolder: 'Select a bookmark to view details' })
                .then(selectedBookmark => {
                    if (selectedBookmark) {
                        const selectedBookmarkId = sortedFilteredBookmarks.find(bookmark => bookmark.displayName === selectedBookmark).id;
                        vscode.commands.executeCommand('workbench.extensions.search', `${selectedBookmarkId}`);
                    }
                });
        }
    }));

    // Command to change the sorting option
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.sortBookmarks', async () => {
        const options = ['A-Z', 'Z-A', 'New-Old', 'Old-New'];
        const selectedOption = await vscode.window.showQuickPick(options, { placeHolder: 'Select a sorting option' });
        if (selectedOption) {
            await vscode.workspace.getConfiguration('extension-bookmarker').update('sortingOption', selectedOption, vscode.ConfigurationTarget.Global);
            bookmarkDataProvider.refresh();
            vscode.window.showInformationMessage(`Sorting option has been changed to ${selectedOption}.`);
        }
    }));

    // Command to add a note to a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.addNote', async (item) => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        let bookmark;
        if (item) {
            bookmark = bookmarks.find(bookmark => bookmark.id === item.command.arguments[0]);
        } else {
            const sortedBookmarks = bookmarks.sort((a, b) => a.displayName.localeCompare(b.displayName)); // Sort bookmarks A-Z
            const selectedBookmark = await vscode.window.showQuickPick(sortedBookmarks.map(bookmark => bookmark.displayName), { placeHolder: 'Select a bookmark to add a note' });
            bookmark = bookmarks.find(bookmark => bookmark.displayName === selectedBookmark);
        }
        if (bookmark) {
            if (bookmark.note) {
                vscode.window.showInformationMessage(`Bookmark ${bookmark.displayName} already has a note.`);
            } else {
                const newNote = await vscode.window.showInputBox({ prompt: 'Enter the note for the bookmark' });
                if (newNote) {
                    bookmark.note = newNote;
                    await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                    bookmarkDataProvider.refresh();
                    vscode.window.showInformationMessage(`Note has been added to ${bookmark.displayName}.`);
                }
            }
        }
    }));

    // Command to edit a note of a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.editNote', async (item) => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        let bookmark;
        if (item) {
            bookmark = bookmarks.find(bookmark => bookmark.id === item.command.arguments[0]);
        } else {
            const sortedBookmarks = bookmarks.sort((a, b) => a.displayName.localeCompare(b.displayName)); // Sort bookmarks A-Z
            const selectedBookmark = await vscode.window.showQuickPick(sortedBookmarks.map(bookmark => bookmark.displayName), { placeHolder: 'Select a bookmark to edit a note' });
            bookmark = bookmarks.find(bookmark => bookmark.displayName === selectedBookmark);
        }
        if (bookmark) {
            if (bookmark.note) {
                const newNote = await vscode.window.showInputBox({ prompt: 'Enter the new note for the bookmark', value: bookmark.note });
                if (newNote) {
                    bookmark.note = newNote;
                    await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                    bookmarkDataProvider.refresh();
                    vscode.window.showInformationMessage(`Note has been updated for ${bookmark.displayName}.`);
                }
            } else {
                vscode.window.showInformationMessage(`Bookmark ${bookmark.displayName} does not have a note to edit.`);
            }
        }
    }));

    // Command to remove a note from a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.removeNote', async (item) => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        let bookmark;
        if (item) {
            bookmark = bookmarks.find(bookmark => bookmark.id === item.command.arguments[0]);
        } else {
            const sortedBookmarks = bookmarks.sort((a, b) => a.displayName.localeCompare(b.displayName)); // Sort bookmarks A-Z
            const selectedBookmark = await vscode.window.showQuickPick(sortedBookmarks.map(bookmark => bookmark.displayName), { placeHolder: 'Select a bookmark to remove a note' });
            bookmark = bookmarks.find(bookmark => bookmark.displayName === selectedBookmark);
        }
        if (bookmark) {
            if (bookmark.note) {
                delete bookmark.note;
                await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', bookmarks, vscode.ConfigurationTarget.Global);
                bookmarkDataProvider.refresh();
                vscode.window.showInformationMessage(`Note has been removed from ${bookmark.displayName}.`);
            } else {
                vscode.window.showInformationMessage(`Bookmark ${bookmark.displayName} does not have a note.`);
            }
        }
    }));

    // Command to view a bookmark's details - text document
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.viewDetails', async (item) => {
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        let bookmark;
        if (item) {
            bookmark = bookmarks.find(bookmark => bookmark.id === item.command.arguments[0]);
        } else {
            const sortedBookmarks = bookmarks.sort((a, b) => a.displayName.localeCompare(b.displayName)); // Sort bookmarks A-Z
            const selectedBookmark = await vscode.window.showQuickPick(sortedBookmarks.map(bookmark => bookmark.displayName), { placeHolder: 'Select a bookmark to view details' });
            bookmark = bookmarks.find(bookmark => bookmark.displayName === selectedBookmark);
        }
        if (bookmark) {
            let details = `ID: ${bookmark.id}\nName: ${bookmark.displayName}\nCategory: ${bookmark.category}`;
            if (bookmark.tags && bookmark.tags.length > 0) {
                details += `\nTags: ${bookmark.tags.sort().join(', ')}`; // Sort tags A-Z
            }
            details += `\nAdded: ${bookmark.dateAdded}\n\nDownloads: ${bookmark.downloadCount}\nRating: ${bookmark.rating}\nUpdated: ${bookmark.lastUpdate}`;
            if (bookmark.note) {
                details += `\n\nNote: ${bookmark.note}`;
            }
            const document = await vscode.workspace.openTextDocument({ content: details, language: 'markdown' });
            await vscode.window.showTextDocument(document);
        }
    }));

    // Command to import data
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.importData', async () => {
        const filePath = await vscode.window.showOpenDialog({ defaultUri: vscode.Uri.file(vscode.workspace.rootPath), canSelectMany: false, filters: { 'JSON': ['json'] } });
        if (filePath && filePath[0]) {
            fs.readFile(filePath[0].fsPath, (err, data) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to import data: ${err}`);
                } else {
                    try {
                        const parsedData = JSON.parse(data);
                        if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData) || !parsedData.categories || !parsedData.bookmarks || !parsedData.tags) {
                            vscode.window.showErrorMessage('Invalid data structure. The file should contain an object with "categories", "bookmarks", and "tags" arrays.');
                            return;
                        }
                        const { categories: importedCategories, bookmarks: importedBookmarks, tags: importedTags } = parsedData;
                        if (!Array.isArray(importedCategories) || !Array.isArray(importedBookmarks) || !Array.isArray(importedTags)) {
                            vscode.window.showErrorMessage('Invalid data structure. "categories", "bookmarks", and "tags" should be arrays.');
                            return;
                        }
                        const existingCategories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
                        const existingBookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
                        const existingTags = vscode.workspace.getConfiguration('extension-bookmarker').get('tags', []);

                        // Merge categories, bookmarks, and tags, removing duplicates
                        const mergedCategories = [...new Set([...existingCategories, ...importedCategories])];
                        const mergedBookmarks = [...existingBookmarks, ...importedBookmarks.filter((importedBookmark) =>
                            !existingBookmarks.some(existingBookmark => existingBookmark.id === importedBookmark.id)
                        )];
                        const mergedTags = [...new Set([...existingTags, ...importedTags])];

                        Promise.all([
                            vscode.workspace.getConfiguration('extension-bookmarker').update('categories', mergedCategories, vscode.ConfigurationTarget.Global),
                            vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', mergedBookmarks, vscode.ConfigurationTarget.Global),
                            vscode.workspace.getConfiguration('extension-bookmarker').update('tags', mergedTags, vscode.ConfigurationTarget.Global) // Update tags
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

    // Command to export data
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.exportData', async () => {
        const categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const tags = vscode.workspace.getConfiguration('extension-bookmarker').get('tags', []);
        if ((categories.length === 1 && categories[0] === 'Default') && bookmarks.length === 0 && tags.length === 0) {
            vscode.window.showInformationMessage('No data to export.');
            return;
        }
        const data = { categories, bookmarks, tags };
        const filePath = await vscode.window.showSaveDialog({ defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath, 'extension-bookmarker-data.json')) });
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
        const categories = vscode.workspace.getConfiguration('extension-bookmarker').get('categories', []);
        const bookmarks = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarks', []);
        const tags = vscode.workspace.getConfiguration('extension-bookmarker').get('tags', []);
        if ((categories.length === 1 && categories[0] === 'Default') && bookmarks.length === 0 && tags.length === 0) {
            vscode.window.showInformationMessage('No data to remove.');
            return;
        }
        const confirmation = await vscode.window.showInputBox({ prompt: 'Type "remove all data" to confirm' });
        if (confirmation === 'remove all data') {
            await vscode.workspace.getConfiguration('extension-bookmarker').update('categories', ["Default"], vscode.ConfigurationTarget.Global);
            await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', [], vscode.ConfigurationTarget.Global);
            await vscode.workspace.getConfiguration('extension-bookmarker').update('tags', [], vscode.ConfigurationTarget.Global); // Remove all tags
            bookmarkDataProvider.refresh();
            vscode.window.showInformationMessage(`All data has been removed.`);
        } else {
            vscode.window.showInformationMessage('Data removal cancelled.');
        }
    }));
}

// This method is called when the extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
};
