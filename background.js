"use strict";

/*
 * Dependencies:
 * core/util.js
 * background/duplication.js
 */

function duplicateActiveTab(advanced) {
  // get a Promise to retrieve the current tab
  var gettingActiveTab = browser.tabs.query({
    active: true,
    currentWindow: true
  })

  // get the activate tab to duplicate from the Promise
  gettingActiveTab.then((tabs) => {
    // get the first (only) tab in the array to duplicate
    let tab = tabs[0]
    if (advanced) {
      advancedDuplicate(tab)
    } else {
      duplicate(tab)
    }
  }).catch(expect("Couldn't get the active tab"))
}

// listen for clicks on the icon to run the duplicate function
browser.browserAction.onClicked.addListener(duplicate)

// ids for context menus on tabs
let contextMenuId = 'duplicate-menu'
let contextMenuAdvancedId = 'duplicate-advanced-menu'

function tabContextRun(info, tab) {
  switch (info.menuItemId) {
    case contextMenuId:
    duplicate(tab)
    break;
  }
}

function tabContextAdvancedRun(info, tab) {
  switch (info.menuItemId) {
    case contextMenuAdvancedId:
    advancedDuplicate(tab)
    break;
  }
}

/*
 * Use var to declare these functions so we can access them
 * from settings.js when we query the background page so
 * we can apply the changes to these settings immediately.
 */
var addTabContextMenu = null
var removeTabContextMenu = null
var addTabContextAdvancedMenu = null
var removeTabContextAdvancedMenu = null

// will be undefined on android
if (browser.contextMenus) {
  addTabContextMenu = function() {
    // add a right click Duplicate menu to tabs
    browser.contextMenus.create({
      id: contextMenuId,
      title: 'Duplicate',
      contexts: [ 'tab' ]
    })
    // listen to the context menu being clicked
    browser.contextMenus.onClicked.addListener(tabContextRun)
  }

  removeTabContextMenu = function() {
    // remove this context menu
    // will do nothing if the menu didn't exist
    browser.contextMenus.onClicked.removeListener(tabContextRun)
    browser.contextMenus.remove(contextMenuId)
  }

  doIf("tabContext", defaults, addTabContextMenu, removeTabContextMenu)

  addTabContextAdvancedMenu = function() {
    browser.contextMenus.create({
      id: contextMenuAdvancedId,
      title: 'Advanced duplicate',
      contexts: [ 'tab' ]
    })
    browser.contextMenus.onClicked.addListener(tabContextAdvancedRun)
  }

  removeTabContextAdvancedMenu = function() {
    browser.contextMenus.onClicked.removeListener(tabContextAdvancedRun)
    browser.contextMenus.remove(contextMenuAdvancedId)
  }

  doIf("tabContextAdvanced", defaults,
    addTabContextAdvancedMenu, removeTabContextAdvancedMenu)
}

// will be undefined on android
if (browser.commands) {
  browser.commands.onCommand.addListener((command) => {
    if (command === 'duplicate-shortcut-1') {
      doIf('keyboardShortcut1Enabled', defaults, () => {
        duplicateActiveTab(false)
      })
    }
    if (command === 'duplicate-shortcut-2') {
      doIf('keyboardShortcut2Enabled', defaults, () => {
        duplicateActiveTab(false)
      })
    }
    if (command === 'duplicate-shortcut-3') {
      doIf('keyboardShortcut3Enabled', defaults, () => {
        duplicateActiveTab(false)
      })
    }
    if (command === 'advanced-duplicate-shortcut-1') {
      doIf('advancedDuplicationShortcutEnabled', defaults, () => {
        duplicateActiveTab(true)
      })
    }
  })
}
