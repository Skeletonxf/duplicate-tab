"use strict";

function logError(e) {
  console.log(`Error: ${e}`)
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

// duplicates the tab given
function duplicate(oldTab) {
  browser.tabs.duplicate(oldTab.id).then((tab) => {
    browser.storage.local.get("switchFocus").then((r) => {
      // check if user disabled switching focus
      let switchFocus = true
      if ('switchFocus' in r) {
        switchFocus = r.switchFocus
      }
      // older versions of Firefox didn't switch focus
      // automatically when using duplicate
      // newer ones do
      if (switchFocus) {
        browser.tabs.update(tab.id, {active: true})
      } else {
        browser.tabs.update(oldTab.id, {active: true})
      }
    })
  })
}

// listen for clicks on the icon to run the duplicate function
browser.browserAction.onClicked.addListener(duplicate)

let contextMenuId = "duplicate-menu"

// these will be undefined on android
if (browser.contextMenus) {
  // add a right click Duplicate menu to tabs
  browser.contextMenus.create({
    id: contextMenuId,
    title: "Duplicate",
    contexts: ["tab"]
  })

  // listen to the context menu being clicked
  browser.contextMenus.onClicked.addListener(function(info, tab) {
    switch (info.menuItemId) {
      case contextMenuId:
        duplicate(tab)
        break;
    }
  })
}
