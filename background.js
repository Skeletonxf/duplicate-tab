"use strict";

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
  }).catch(onError)
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

// will be undefined on android
if (browser.contextMenus) {
  doIf("tabContext", defaults, () => {
    // add a right click Duplicate menu to tabs
    browser.contextMenus.create({
      id: contextMenuId,
      title: 'Duplicate',
      contexts: [ 'tab' ]
    })
    // listen to the context menu being clicked
    browser.contextMenus.onClicked.addListener(tabContextRun)
  }, () => {
    // remove this context menu
    // will do nothing if the menu didn't exist
    // once Firefox supports ES6 modules move this
    // code into module so settings.js can call it
    // to immediately apply context settings
    browser.contextMenus.onClicked.removeListener(tabContextRun)
    browser.contextMenus.remove(contextMenuId)
  })

  doIf("tabContextAdvanced", defaults, () => {
    browser.contextMenus.create({
      id: contextMenuAdvancedId,
      title: 'Advanced duplicate',
      contexts: [ 'tab' ]
    })
    browser.contextMenus.onClicked.addListener(tabContextAdvancedRun)
  }, () => {
    browser.contextMenus.onClicked.removeListener(tabContextAdvancedRun)
    browser.contextMenus.remove(contextMenuAdvancedId)
  })
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
