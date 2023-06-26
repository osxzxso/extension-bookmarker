Extension Bookmarker
====================

Overview
--------

Extension Bookmarker allows you to bookmark other VS Code extensions. This makes it easy to keep track of your favorite or frequently used extensions, as well as those you are interested in but perhaps not ready to install yet. Added bookmarks are persistently stored and can be viewed, opened, and removed as needed.

Features and Use
-----------------
**Add a bookmark using Command Palette:**
  1. Open the Command Palette by pressing `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac).
  2. Type "Add Extension Bookmark" and select the command.
  3. Enter the identifier of the extension.
  4. Press Enter to add the extension to your bookmark list.

**Add a bookmark from UI:**
  1. Open the Extension Bookmarker view by clicking on the "Extension Bookmarker" icon in the Activity Bar on the side.
  2. Click on the "+" button in the view header.
  3. Enter the identifier of the extension.
  4. Press Enter to add the extension to your bookmark list.

**View all bookmarks using Command Palette:**
  1. Open the Command Palette by pressing `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac).
  2. Type "View Extension Bookmarks" and select the command.
  3. A list of your bookmarked extensions will appear.

**View all bookmarks from UI:**
  1. Open the Extension Bookmarker view by clicking on the "Extension Bookmarker" icon in the Activity Bar on the side.
  2. The view will display a list of your bookmarked extensions.

**Remove a bookmark using Command Palette:**
  1. Open the Command Palette by pressing `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac).
  2. Type "Remove Extension Bookmark" and select the command.
  3. Enter the identifier of the extension.
  5. Press Enter and the extension will be removed from your bookmark list.

**Remove a bookmark from UI:**
  1. Open the Extension Bookmarker view by clicking on the "Extension Bookmarker" icon in the Activity Bar on the side.
  2. Right-click on the bookmarked extension you want to remove.
  3. Select the "Remove Extension Bookmark" option from the context menu.
  4. The extension will be removed from your bookmark list.

**Open a bookmarked extension within the Marketplace:**
  1. Open the Extension Bookmarker view by clicking on the "Extension Bookmarker" icon in the Activity Bar on the side.
  2. Click on the bookmarked extension you want to open.
  3. The Marketplace search result page for the selected extension will appear.
  4. Click on the extension to open in the Extensions view.

How to locate and copy an extension's identifier within the VS Code Extensions Marketplace:
-------------------------------------------------------------------------------------------
1. Open the Extensions view in Visual Studio Code by clicking on the "Extensions" icon in the Activity Bar on the side or by using the shortcut `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac).
2. In the search bar at the top, enter the name or keywords related to the extension you are looking for.
3. From the search results, locate the extension you are interested in, right click on it and select "Copy Extension ID". The extension's identifier is now copied.
3. Alternatively, from the search results, locate the extension you are interested in and click on it to open its details page.
4. On the details page, you will find the extension's identifier listed under the extension's "More Info" section. Select the identifier and press `Ctrl+C`. The extension's identifier is now copied.

**Note**: When adding or removing bookmarks, make sure to copy the identifier exactly as shown, including the publisher and extension name (publisher.extensionname).

Upcoming Features
-----------------
1. **Synchronization Across Installations**: Your bookmarks will be synced across different installations of Visual Studio Code.
2. **Categorization of Bookmarks**: Navigate through your bookmarks with ease using the ability to create, rename, and delete folders. Drag and drop your bookmarked extensions where you want them.
3. **Search Functionality**: Find your bookmarked extensions quickly and efficiently with the added search function.
4. **Sorting Options**: Organize your bookmarks in the way that works best for you with alphabetical (A-Z, Z-A), chronological (New-Old, Old-New), and more sorting options.
5. **Tagging/Filtering System**: Add multiple tags to each bookmark for improved organization, filtering, and retrieval.
6. **Import/Export Bookmarks**: Safeguard and share your bookmarks with others through import and export functionalities.
7. **Extension Recommendations**: Get recommendations for other extensions you might find useful, based on your current set of bookmarked extensions.
8. **Bookmark Notes**: Add personal notes to each bookmark for better context and recall.
9. **Favorites and Prioritization**: Mark bookmarks as favorites or assign them a priority level for easy access to important bookmarks.
10. **Bulk Add/Move/Remove Bookmarks**: Manage your bookmarks efficiently with the ability to add, move, and/or remove bookmarks in bulk.
11. **Extension Stats**: Make informed decisions about which extensions to keep or remove with statistics about your bookmarked extensions, such as download count, rating, and last update date.

CURRENT VERSION - 1.0.0
-----------------------
### CHANGES - released on 6/25/2023
- Initial release of Extension Bookmarker.
- Add, view, and remove bookmarks from the Command Palette or UI.
- Open bookmarks in the Extensions view of the Visual Studio Code Marketplace.
### ISSUES - last updated on 6/25/23
⬜ Remove Extension bookmark command from the command palette doesn't work, and needs to account for when there are no bookmakrs yet and the command is executed.  
⬜ UI commands appear in the command palette. Hide them from the command palette, if possible.  
✅ Unicode icons for the command palette add (plus) and view (eye) and remove (trash) commands need to be added.  
⬜ Add a screenshot(s) to the README.md file.

Support
-------
If you encounter any problems or have suggestions for the Extension Bookmarker, feel free to open an issue on the [GitHub repository](https://github.com/osxzxso/extension-bookmarker.git). Your feedback is always welcome and appreciated!
