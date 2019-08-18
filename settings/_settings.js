import core from '/core/script.js'
import defaults from '/settings/_defaults.js'

// TODO populate values from defaults somehow
let shortcuts = {
  // values refer to the ith labels in the table corresponding
  // to the shortcut description
  // TODO remove magic numbers
  keyboardShortcut1Enabled: 0,
  keyboardShortcut2Enabled: 4,
  keyboardShortcut3Enabled: 8,
  advancedDuplicationShortcutEnabled: 12
}

let labels

let port = browser.runtime.connect({
    name: 'contextMenus'
})

document.addEventListener("DOMContentLoaded", () => {

    core.settings.syncPage(defaults)

    // let backgroundPage = null

    // {
    //     let tabContext = document.querySelector('#tabContextLabel')
    //     let tabContextAdvanced = document.querySelector('#tabContextAdvancedLabel')
    //     browser.runtime.getBackgroundPage().then((background) => {
    //         console.log(background.refreshContextMenus)
    //         console.log(background)
    //         if (background === null) {
    //             // We're in a private about:addons which means
    //             // we can't access the background page
    //             // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/getBackgroundPage
    //             let warning = ' (Requires non private about:addons change or restart to take effect)'
    //             tabContext.textContent += warning
    //             tabContextAdvanced.textContent += warning
    //             return
    //         }
    //         // save the background page for applying changes
    //         backgroundPage = background
    //     }).catch(core.expect('No access to background page?'))
    // }

    for (let property in defaults) {
        let toggle = document.querySelector("#" + property)
        toggle.addEventListener('change', () => {

            // Propagate the new state of this toggle to the local storage
            let setting = {}
            setting[property] = toggle.checked
            browser.storage.local.set(setting)
            core.log(setting)

            if (property in shortcuts) {
                labels[shortcuts[property]].classList.toggle('disabled')
            }
            // if (backgroundPage !== null) {
            //     // If we have access to the background page then
            //     // immediately apply the tab context menu settings
            //     // when the user changes them
            //     refreshContextMenus()
            //     console.log(refreshContextMenus)
            // }
            if (property === "tabContext" || property === "tabContextAdvanced") {
                port.postMessage({
                    refreshContextMenus: true
                })
            }
        })
    }

    {
      // Disable settings that don't work on Android

      function disable(setting) {
          setting.style.opacity = 0.5
          setting.style.pointerEvents = 'none'
          let text = document.createElement('strong')
          text.textContent = 'Unsupported on your device/browser version'
          text.style.fontSize = 'large'
          text.style.color = 'darkred'
          setting.prepend(text)
      }

      if (browser.contextMenus === undefined) {
          // will be undefined on android
          disable(document.querySelector('#tabContextSettings'))
      }

      if (browser.commands === undefined) {
          // will be undefined on android
          disable(document.querySelector('#commandSettings'))
      }
    }

    ShortcutCustomizeUI.build().then(list => {
        // append the ui to the shortcuts div
        document.getElementById('shortcuts').appendChild(list)
        // get all of the customization labels added to page
        labels = document.querySelectorAll('#shortcuts ul li label')
        // now apply the enabled/disabled css to each
        for (let shortcut in shortcuts) {
            let i = shortcuts[shortcut]
            core.settings.doIf(shortcut, defaults, () => {
                // do nothing as enabled
            }, () => {
                labels[i].classList.add('disabled')
            })
        }
    }).catch(core.expect('Failed to build ShortcutCustomizeUI lib'))

})
