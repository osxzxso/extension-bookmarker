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
        const bookmarkedExtensions = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarkedExtensions', []);
        let extensionsWithNames = [];

        for (let extensionId of bookmarkedExtensions) {
            let [publisher, extensionName] = extensionId.split('.');
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
                let extensionData = response.data.results[0].extensions[0];
                if(extensionData){
                    let displayName = extensionData.displayName;
                    let icon = extensionData.versions[0].files.find(file => file.assetType === "Microsoft.VisualStudio.Services.Icons.Default")?.source;
                    extensionsWithNames.push({ id: extensionId, displayName: displayName, icon: icon });
                }
                else{
                    // Removing the extensionId from the bookmarkedExtensions array if the extension is not found
                    let index = bookmarkedExtensions.indexOf(extensionId);
                    if (index > -1) {
                        bookmarkedExtensions.splice(index, 1);
                        await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarkedExtensions', bookmarkedExtensions, vscode.ConfigurationTarget.Global);
                    }
                }
            } catch (error) {
                console.error(`Failed to load extension ${extensionId}: ${error}`);
            }
        }

        return extensionsWithNames.reverse().map(extension => {
            return {
                label: extension.displayName,
                command: {
                    command: 'extension-bookmarker.openExtension',
                    arguments: [extension.id],
                    title: 'Open Extension'
                },
                contextValue: 'bookmarkedExtension',
                iconPath: extension.icon ? vscode.Uri.parse(extension.icon) : new vscode.ThemeIcon('bookmark')
            };
        });

    }

}

function activate(context) {
    const bookmarkDataProvider = new BookmarkDataProvider();
    vscode.window.registerTreeDataProvider('extensionBookmarkerView', bookmarkDataProvider);

    // Command to add a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.addBookmark', async () => {
        const bookmarkedExtensions = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarkedExtensions', []);
        const selectedExtension = await vscode.window.showInputBox({ prompt: 'Enter the identifier of the extension (publisher.extensionname)' });

        if (selectedExtension && !bookmarkedExtensions.includes(selectedExtension)) {
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
                    bookmarkedExtensions.push(selectedExtension);
                    await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarkedExtensions', bookmarkedExtensions, vscode.ConfigurationTarget.Global);
                    bookmarkDataProvider.refresh();
                    vscode.window.showInformationMessage(`Extension ${selectedExtension} has been bookmarked.`);
                } else {
                    vscode.window.showErrorMessage(`Extension ${selectedExtension} not found.`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to add bookmark for ${selectedExtension}: ${error}`);
            }
        }
    }));

    // Command to add a bookmark from UI
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.addBookmarkFromUI', async () => {
        const bookmarkedExtensions = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarkedExtensions', []);
        const selectedExtension = await vscode.window.showInputBox({ prompt: 'Enter the identifier of the extension (publisher.extensionname)' });

        if (selectedExtension && !bookmarkedExtensions.includes(selectedExtension)) {
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
                    bookmarkedExtensions.push(selectedExtension);
                    await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarkedExtensions', bookmarkedExtensions, vscode.ConfigurationTarget.Global);
                    bookmarkDataProvider.refresh();
                    vscode.window.showInformationMessage(`Extension ${selectedExtension} has been bookmarked.`);
                } else {
                    vscode.window.showErrorMessage(`Extension ${selectedExtension} not found.`);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to add bookmark for ${selectedExtension}: ${error}`);
            }
        }
    }));

    // Command to view all bookmarks
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.viewBookmarks', async () => {
        const bookmarkedExtensions = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarkedExtensions', []);
        const selectedExtension = await vscode.window.showQuickPick(bookmarkedExtensions, { placeHolder: 'Select an extension to view details' });
        if (selectedExtension) {
            vscode.commands.executeCommand('workbench.extensions.search', selectedExtension);
        }
    }));

    // Command to open a bookmarked extension in the Extensions view
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.openExtension', (extension) => {
        vscode.commands.executeCommand('workbench.extensions.search', extension);
    }));

    // Command to remove a bookmark
    context.subscriptions.push(vscode.commands.registerCommand('extension-bookmarker.removeBookmark', async (item) => {
        const bookmarkedExtensions = vscode.workspace.getConfiguration('extension-bookmarker').get('bookmarkedExtensions', []);
        const index = bookmarkedExtensions.indexOf(item.command.arguments[0]); // Use extension id here
        if (index > -1) {
            bookmarkedExtensions.splice(index, 1);
            await vscode.workspace.getConfiguration('extension-bookmarker').update('bookmarkedExtensions', bookmarkedExtensions, vscode.ConfigurationTarget.Global);
            bookmarkDataProvider.refresh();
            vscode.window.showInformationMessage(`Extension ${item.label} has been removed from bookmarks.`);
        }
    }));
}

// This method is called when the extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}
