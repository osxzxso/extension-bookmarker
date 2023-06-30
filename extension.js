const vscode = require('vscode');
const axios = require('axios');

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
    
        console.log('Categories:', categories);
        console.log('Bookmarks:', bookmarks);
        
        if (element) {
            return bookmarks.filter(bookmark => bookmark.category === element.label).map(bookmark => {
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

    // Command to select adding a bookmark or category
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.add', async () => {
        const options = ['Add Bookmark', 'Add Category'];
        const selectedOption = await vscode.window.showQuickPick(options, { placeHolder: 'Select an option' });
        if (selectedOption === options[0]) {
          vscode.commands.executeCommand('extension-bookmarker.addBookmark');
        } else if (selectedOption === options[1]) {
          vscode.commands.executeCommand('extension-bookmarker.addCategory');
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
                    bookmarks.push({ id: selectedExtension, displayName: displayName, icon: icon, category: selectedCategory });
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

    // Command to remove all data
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.removeAllData', async () => {
        await vscode.workspace.getConfiguration('extension-bookmarker').update('categories', ["Default"], vscode.ConfigurationTarget.Global);
        await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarks', [], vscode.ConfigurationTarget.Global);
        bookmarkDataProvider.refresh();
        vscode.window.showInformationMessage(`All data has been removed.`);
    }));
}

// This method is called when the extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}
