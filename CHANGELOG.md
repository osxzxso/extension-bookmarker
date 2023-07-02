Changelog
=========

All notable changes to the "Extension Bookmarker" extension will be documented in this file.

CURRENT VERSION - 1.0.0
-----------------------
### CHANGES - released on 7/1/2023
- Initial release of Extension Bookmarker.
- Add and remove bookmarks, as well as select a category to associate each bookmark with.
- Select a bookmark to open it in the VSC Extensions Marketplace.
- Add, rename, and remove categories (folders), as well as move bookmarks from one category to another.
- Search through your bookmarks.
- Import and export all your data.
- Add multiple tags to each bookmark for improved organization, filtering, and retrieval.
- Sort bookmarks in alphabetical (A-Z, Z-A) or chronological (New-Old, Old-New) order.
- Add a personal note to each bookmark for added context and better recall.
- View that includes each bookmark's properties and note, as well as marketplace details such as: download count, rating, and last update date.
- Ability to remove all data in one command (confirmation required).
### ISSUES - last updated on 7/1/23
⬜ Some of the commands, when used from the command palette, are not working; however, they are working when used from the extension UI.  
⬜ In general, all the commands appear in the command palette. Hide/Remove them from the command palette so that they can only be used from the extension UI, if possible.  
⬜ Add screenshots and demo to this README.md file.  
⬜ Potentially reorder of items in the action menu as well as the items in the context menus.
⬜ Fix the way canceling an action occurs. For example, if you start the "Add Bookmark" action, then immediately click out of the action or press Escape to cancel the action, without completing anything, it should not proceed to "select category" then continue to "Bookmark undefined already exists".