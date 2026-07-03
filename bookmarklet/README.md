# Case Title Updater - Bookmarklet Version

## What is a Bookmarklet?
A bookmarklet is a bookmark that runs JavaScript code instead of navigating to a URL. It works on any website and doesn't require any extension installation.

## Setup Instructions

### Step 1: Create the Bookmark

**For Chrome/Edge:**
1. Open your browser
2. Press `Ctrl+D` (Windows) or `Cmd+D` (Mac) to create a new bookmark
3. Name it: **Case Title Updater**
4. Copy the entire code from `bookmarklet.js` file
5. Paste it into the URL field
6. Click Save

**For Firefox:**
1. Press `Ctrl+Shift+D` (Windows) or `Cmd+Shift+D` (Mac)
2. Name it: **Case Title Updater**
3. Copy the code from `bookmarklet.js`
4. Paste into the Location field
5. Click Done

### Step 2: Use the Bookmarklet

1. Navigate to your Dynamics 365 case page
2. Click the **Case Title Updater** bookmark
3. A popup dialog will appear
4. Select a case code
5. (Optional) Select a follow-up date
6. (Optional) Check "Preserve rest of title" if needed
7. Click **Preview** to see the result
8. Click **Copy** to copy to clipboard, or **Apply** to update the field directly
9. Click **Close** to close the dialog

## Features

✅ Works on any website (no installation needed)
✅ Popup dialog with case code selector
✅ Date picker (defaults to today, no past dates)
✅ Preview functionality
✅ Copy to clipboard
✅ Apply directly to Internal Title field
✅ Preserve rest of title option

## Example

**Without date:**
- Input: `ACU| WOCT`
- Output: `WOCT - Waiting on Customer`

**With date:**
- Input: `ACU| WOCT`
- Output: `WOCT - Waiting on Customer | NC: 04-July`

## Notes

- The bookmarklet is a single line of JavaScript
- No server needed - runs entirely in your browser
- Works on locked devices where extensions are blocked
- Completely offline
- Data never leaves your browser

## Sharing with Team

You can share the bookmarklet code via:
1. Email the `bookmarklet.js` file
2. Share the code in a document
3. Internal wiki/knowledge base
4. Instructions file in shared folder

Each user creates their own bookmark with the same code.

## Troubleshooting

**Bookmark doesn't work:**
- Make sure the entire code is in the URL field
- Check that it starts with `javascript:`
- Try refreshing the page first

**Popup doesn't appear:**
- Check browser console (F12) for errors
- Make sure you're on a Dynamics 365 case page
- Try creating the bookmark again

**Field not found:**
- The bookmarklet looks for: `textarea[aria-label="Internal title"]`
- If Dynamics 365 changes their structure, this may need updating
