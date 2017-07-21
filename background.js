// duplicates the active tab
function duplicate() {
  // get a Promise to retrieve the current tab
  var gettingActiveTab = browser.tabs.query({
    active: true, 
    currentWindow: true
  })
  // duplicate the new tab using the id of the current tab from the Promise
  gettingActiveTab.then(function(tabs) {
    //console.log(tabs.length) debugging only
    //console.log(tabs[0]) debugging only

    // get the url of the (only) item in the array to duplicate it
    browser.tabs.create({
      url: tabs[0].url,
      // create the new tab just after the current tab
      index: tabs[0].index + 1
    })
  })
}

// listen for clicks on the icon to run the duplicate function
browser.browserAction.onClicked.addListener(duplicate);
