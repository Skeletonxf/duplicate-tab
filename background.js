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
function duplicate(tab) {
  browser.tabs.duplicate(tab.id).then((tab) => {
    // now change the focus to the new tab
    browser.tabs.update(tab.id, {active: true})
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
