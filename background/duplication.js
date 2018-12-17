"use strict";

/*
 * Dependencies
 * core/util.js
 */

// duplicates the tab given
function duplicate(oldTab) {
  if (browser.tabs.duplicate === undefined) {
    // browser.tabs.duplicate is listed as supported from FF Android 54
    // but is not a function in FF Android 63????
    browser.tabs.create({
      url: oldTab.url
    }).catch(expect('Failed to create new tab with URL as fallback'))
    return
  }
  browser.tabs.duplicate(oldTab.id).then((tab) => {
    // older versions of Firefox didn't switch focus
    // automatically when using duplicate
    // newer ones do
    doIf('switchFocus', defaults, () => {
      browser.tabs.update(tab.id, {active: true})
    }, () => {
      browser.tabs.update(oldTab.id, {active: true})
    })
  }).catch(expect('Failed to duplicate tab'))
}

// launches advanced duplication tab
function advancedDuplicate(oldTab) {
  console.log('checking for old tab url field' + oldTab.url)
  browser.tabs.create({
    url: '/page/page.html',
    active: true,
    // Place the duplicate WebExtension page just after the tab
    index: oldTab.index + 1
  }).then((tab) => {
    browser.tabs.executeScript(tab.id, {
      file: '/page/script.js'
    }).then(() => {
      // Give the WebExtension page the old tab's URL
      browser.tabs.sendMessage(tab.id, {
        url: oldTab.url,
        incognito: oldTab.incognito
      })
      function listener(request) {
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
            }).catch(expect('Failed to create window from old URL'))
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
            }).catch(expect('Failed to create incognito window from old URL'))
          }
        }
        // close advanced duplication
        console.log('closing tab')
        browser.tabs.remove(tab.id)
        console.log('removing listener')
        browser.runtime.onMessage.removeListener(listener)
      }
      // Close the page automatically if the user tabs out of it
      browser.tabs.onActivated.addListener(function switchTab() {
        console.log('switched tab')
        browser.tabs.onActivated.removeListener(switchTab)
        browser.runtime.onMessage.removeListener(listener)
        browser.tabs.remove(tab.id)
      })
      // Listen to the WebExtension page for a button click
      browser.runtime.onMessage.addListener(listener)
    }).catch(expect('Failed to inject JS into WebExtension page'))
  }).catch(expect('Failed to create WebExtension page'))
}
