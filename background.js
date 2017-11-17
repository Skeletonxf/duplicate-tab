"use strict";

function logError(e) {
  console.log(`Error: ${e}`)
}

let defaults = {
  switchFocus : true,
  tabContext : false,
  keyboardShortcutEnabled : true
}

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

// runs the action function if the
// setting is resolved to true, either
// by the default being true or the
// setting from the browser's local storage
// being true, and runs the ifNot function
// when not running the action function
// if the ifNot function exists
function doIf(setting, action, ifNot) {
  browser.storage.local.get(setting).then((r) => {
    // check user setting
    let doAction = defaults[setting]
    if (setting in r) {
      doAction = r[setting]
    }
    if (doAction) {
      action()
    } else {
      if (ifNot) {
        ifNot()
      }
    }
  })
}

// duplicates the tab given
function duplicate(oldTab) {
  browser.tabs.duplicate(oldTab.id).then((tab) => {
    // older versions of Firefox didn't switch focus
    // automatically when using duplicate
    // newer ones do
    doIf("switchFocus", () => {
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
  doIf("tabContext", () => {
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
    if (command == "duplicate-shortcut") {
      doIf("keyboardShortcutEnabled", () => {
        duplicateActiveTab()
      })
    }
  })
}
