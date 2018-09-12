
// duplicates the tab given
function duplicate(oldTab) {
  browser.tabs.duplicate(oldTab.id).then((tab) => {
    // older versions of Firefox didn't switch focus
    // automatically when using duplicate
    // newer ones do
    doIf('switchFocus', defaults, () => {
      browser.tabs.update(tab.id, {active: true})
    }, () => {
      browser.tabs.update(oldTab.id, {active: true})
    })
  })
}

// launches advanced duplication tab
function advancedDuplicate(oldTab) {
  console.log('checking for old tab url field' + oldTab.url)
  browser.tabs.create({
    url: '/page/page.html'
  }).then((tab) => {
    browser.tabs.executeScript(tab.id, {
      file: '/page/script.js'
    }).then(() => {
      browser.tabs.sendMessage(tab.id, {
        url: oldTab.url,
        incognito: oldTab.incognito
      })
      browser.tabs.onActivated.addListener(function switchTab() {
        console.log('switched tab')
        browser.tabs.onActivated.removeListener(switchTab)
        // TODO: close advanced duplication page and clear listeners
      })
      browser.runtime.onMessage.addListener(function listener(request) {
        if (request.selected === 'normal') {
          console.log('going to duplicate the tab in normal window')
          // check for existing non incognito tab
          console.log('am i already incognito' + oldTab.incognito)
          if (oldTab.incognito) {
            // must create new tab from old tab's url
            // as can't move tabs between the windows
            // TODO: Use focused and configure with switchFocus setting
            // once Firefox supports it
            // TODO: Use existing normal window if exists?
            browser.windows.create({
              incognito: false,
              url: [ oldTab.url ]
            }).catch(logError)
          } else {
            // can duplicate the old tab
            duplicate(oldTab)
          }
        }
        if (request.selected === 'private') {
          console.log('going to duplicate the tab in private window')
          // check for existing incognito tab
          console.log('am i already incognito' + oldTab.incognito)
          if (oldTab.incognito) {
            // can duplicate the old tab
            duplicate(oldTab)
          } else {
            // must create new tab from old tab's url
            // as can't move tabs between the windows
            // TODO: Use focused and configure with switchFocus setting
            // once Firefox supports it
            // TODO: Use existing incognito window if exists?
            browser.windows.create({
              incognito: true,
              url: [ oldTab.url ]
            }).catch(logError)
          }
        }
        // close advanced duplication
        console.log('closing tab')
        browser.tabs.remove(tab.id)
        console.log('removing listener')
        browser.runtime.onMessage.removeListener(listener)
      })
    }).catch(logError)
  }).catch(logError)
}
