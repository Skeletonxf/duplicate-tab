import core from '/core/script.js'
import defaults from '/settings/defaults.js'

let labels

let port = browser.runtime.connect({
    name: 'contextMenus'
})

document.addEventListener("DOMContentLoaded", () => {
    // apply boolean settings to page
    core.settings.syncPage(defaults, ['duplicateLocation'])

    // handle duplicate location setting explicitly
    let browserDefault = document.querySelector('#duplicateLocationBrowser')
    let right = document.querySelector('#duplicateLocationRight')
    let afterCurrent = document.querySelector('#duplicateLocationAfterCurrent')

    browser.storage.local.get('duplicateLocation').then((result) => {
        let setting = defaults['duplicateLocation']
        if ('duplicateLocation' in result) {
            setting = result.duplicateLocation
        }
        for (let radioButton of [browserDefault, right, afterCurrent]) {
            if (setting === radioButton.value) {
                radioButton.checked = true
            }
        }
    })

    for (let property in defaults) {
        // handle the duplicate location explicitly as it is a 3 way setting
        if (property === 'duplicateLocation') {
            let update = () => {
                for (let radioButton of [browserDefault, right, afterCurrent]) {
                    if (radioButton.checked) {
                        browser.storage.local.set({
                            duplicateLocation: radioButton.value
                        })
                    }
                }
            }
            browserDefault.addEventListener('change', update)
            right.addEventListener('change', update)
            afterCurrent.addEventListener('change', update)
            continue
        }
        // handle all boolean settings
        let toggle = document.querySelector("#" + property)
        toggle.addEventListener('change', () => {
            // Propagate the new state of this toggle to the local storage
            let setting = {}
            setting[property] = toggle.checked
            browser.storage.local.set(setting)

            if (property === 'tabContext' || property === 'tabContextAdvanced') {
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

      if (browser.tabs.move === undefined) {
          // will be undefined on android
          disable(document.querySelector('#locationSettings'))
      }
    }

    browser.extension.isAllowedIncognitoAccess().then((isAllowed) => {
        if (!isAllowed) {
            document.querySelector('#privateBrowsingPermission').classList.remove('hidden')
        }
    }).catch(core.expect('Querying incognito access'))
})
