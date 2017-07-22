// duplicates the active tab
function duplicate() {
  // get a Promise to retrieve the current tab
  var gettingActiveTab = browser.tabs.query({
    active: true, 
    currentWindow: true
  })
  // duplicate the new tab using the id of the current tab from the Promise
  gettingActiveTab.then(function(tabs) {
    // get the id of the (only) item in the array to duplicate it
    browser.tabs.duplicate(tabs[0].id).then(function(tab) {
      // now change the focus to the new tab
      browser.tabs.update(tab.id, {activate: true})
    })
  })
}

// listen for clicks on the icon to run the duplicate function
browser.browserAction.onClicked.addListener(duplicate);
