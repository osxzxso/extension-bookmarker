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
8. **Bookmark Notes**: Add personal note to each bookmark for added context and better recall.
9. **View Extension Details**: View that includes each bookmark's properties and note, as well as marketplace details such as: download count, rating, and last update date.
10. **Remove All Data**: Ability to remove all data in one command (confirmation required).

Upcoming Features
-----------------
1. **Bulk Add/Move/Remove Bookmarks**: Ability to add, move or remove bookmarks in bulk.
2. **Bulk Add/Remove Categories**: Ability to add or remove categories in bulk.
3. **Favorites and Prioritization**: Mark bookmarks as favorites or assign them a priority level for easy access to important bookmarks.
4. **More by Publisher**: View all extensions by a bookmarked extension's publisher.
5. **Synchronization Across Installations**: Sync data across different installations of Visual Studio Code.

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
- Add personal note to each bookmark for added context and better recall.
- View that includes each bookmark's properties and note, as well as marketplace details such as: download count, rating, and last update date.
### ISSUES - last updated on 6/25/23
⬜ Some of the commands, when used from the command palette, are not working; however, they are working when used from the extension UI.  
⬜ In general, the commands appear in the command palette. Hide/Remove them from the command palette so that they can only be used from the extension UI, if possible.  
⬜ Add screenshots and demo to this README.md file.  
⬜ Potentially reorder of items in the action menu as well as the items in the context menus.
⬜ Fix the way canceling an action occurs. For example, if you start the "Add Bookmark" action menu, then immediately click out of the action or press Escape to cancel the action, without completing anything, it should not proceed to select category and say things like, "Bookmark undefined already exists".

Support
-------
If you encounter any problems or have suggestions for the Extension Bookmarker, feel free to open an issue on the [GitHub repository](https://github.com/osxzxso/extension-bookmarker.git). Your feedback is always welcome and appreciated!
