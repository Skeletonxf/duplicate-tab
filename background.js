"use strict";

function duplicateActiveTab() {
  // get a Promise to retrieve the current tab
  var gettingActiveTab = browser.tabs.query({
    active: true,
    currentWindow: true
  })

  // get the activate tab to duplicate from the Promise
  gettingActiveTab.then((tabs) => {
    // get the first (only) tab in the array to duplicate
    duplicate(tabs[0])
  })
}

// duplicates the tab given
function duplicate(oldTab) {
  browser.tabs.duplicate(oldTab.id).then((tab) => {
    // older versions of Firefox didn't switch focus
    // automatically when using duplicate
    // newer ones do
    doIf("switchFocus", defaults, () => {
      browser.tabs.update(tab.id, {active: true})
    }, () => {
      browser.tabs.update(oldTab.id, {active: true})
    })
  })
}

// listen for clicks on the icon to run the duplicate function
browser.browserAction.onClicked.addListener(duplicate)

let contextMenuId = "duplicate-menu"

function tabContextRun(info, tab) {
  switch (info.menuItemId) {
    case contextMenuId:
    duplicate(tab)
    break;
  }
}

// will be undefined on android
if (browser.contextMenus) {
  doIf("tabContext", defaults, () => {
    // add a right click Duplicate menu to tabs
    browser.contextMenus.create({
      id: contextMenuId,
      title: "Duplicate",
      contexts: ["tab"]
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
}

// will be undefined on android
if (browser.commands) {
  browser.commands.onCommand.addListener((command) => {
    if (command === "duplicate-shortcut-1") {
      doIf("keyboardShortcut1Enabled", defaults, () => {
        duplicateActiveTab()
      })
    }
    if (command === "duplicate-shortcut-2") {
      doIf("keyboardShortcut2Enabled", defaults, () => {
        duplicateActiveTab()
      })
    }
    if (command === "duplicate-shortcut-3") {
      doIf("keyboardShortcut3Enabled", defaults, () => {
        duplicateActiveTab()
      })
    }
  })
}
