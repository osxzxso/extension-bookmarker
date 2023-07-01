Extension Bookmarker
====================

Overview
--------

Extension Bookmarker allows you to bookmark other VS Code extensions. This makes it easy to keep track of your favorite or frequently used extensions, as well as those you are interested in but perhaps not ready to install yet.

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

Current Features
-----------------
1. **Addition and Removal of Bookmarks**: Add and remove bookmarks, as well as select a category to associate each bookmark with.
2. **View in Marketplace**: Select a bookmark to open it in the Extensions view of the Visual Studio Code Marketplace.
3. **Categorization of Bookmarks**: Add, rename, and remove categories (folders), as well as move bookmarks from one category to another.
4. **Search Functionality**: Search through your bookmarks.
5. **Import/Export Bookmarks**: Import and export all categories and corresponding bookmarks.
6. **Tagging/Filtering System**: Add multiple tags to each bookmark for improved organization, filtering, and retrieval.
7. **Sorting Options**: Sort bookmarks in alphabetical (A-Z, Z-A) or chronological (New-Old, Old-New) order.

Upcoming Features
-----------------
1. **Bulk Add/Move/Remove Bookmarks**: Ability to add, move or remove bookmarks in bulk.
2. **Bulk Add/Remove Categories**: Ability to add or remove categories in bulk.
3. **Favorites and Prioritization**: Mark bookmarks as favorites or assign them a priority level for easy access to important bookmarks.
4. **Bookmark Notes**: Add personal notes to each bookmark for added context and better recall.
5. **Extension Recommendations**: Get recommendations for other extensions you might find useful, based on your current set of bookmarked extensions.
6. **Extension Stats**: Integrate each bookmark's download count, rating, and last update date into the UI.
7. **Synchronization Across Installations**: Sync data across different installations of Visual Studio Code.

CURRENT VERSION - 1.0.0
-----------------------
### CHANGES - released on 6/25/2023
- Initial release of Extension Bookmarker.
- Add and remove bookmarks, as well as select a category to associate each bookmark with.
- Select a bookmark to open it in the Extensions view of the Visual Studio Code Marketplace.
- Add, rename, and remove categories (folders), as well as move bookmarks from one category to another.
- Search through your bookmarks.
- Import and export all categories and corresponding bookmarks.
- Add multiple tags to each bookmark for improved organization, filtering, and retrieval.
- Sort bookmarks in alphabetical (A-Z, Z-A) or chronological (New-Old, Old-New) order.
### ISSUES - last updated on 6/25/23
⬜ Remove Extension bookmark command from the command palette doesn't work, and needs to account for when there are no bookmakrs yet and the command is executed.  
⬜ UI commands appear in the command palette. Hide them from the command palette, if possible.  
⬜ Add a screenshot(s) to this README.md file.

Support
-------
If you encounter any problems or have suggestions for the Extension Bookmarker, feel free to open an issue on the [GitHub repository](https://github.com/osxzxso/extension-bookmarker.git). Your feedback is always welcome and appreciated!
