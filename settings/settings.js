import console from '/src/logger.js'
import settings from '/src/settings.js'

let settingKeys = [
    'switchFocus',
    'tabContext',
    'tabContextAdvanced'
]

/**
 * Syncs the property checkboxes on the webpage to the default values
 * of these properties from local storage or their default value.
 */
let syncPage = async (properties /* [string] */) => {
    for (let property of properties) {
        let value = await settings.local.getKeyValue(property)
        document.querySelector('#' + property).checked = value
    }
}

/**
 * Syncs the corresponding local storage setting
 * to this value on the page
 */
let syncLocalStorage = async (property) => {
    await settings.local.setKeyValue(property, document.querySelector('#' + property).checked)
}

document.addEventListener('DOMContentLoaded', async () => {
    // apply boolean settings to page
    try {
        await syncPage(settingKeys)
    } catch (error) {
        console.error('Error syncing page to current setting values', error)
    }

    for (let property of settingKeys) {
        document.querySelector('#' + property).addEventListener('change', async () => {
            try {
                await syncLocalStorage(property)
                let port = browser.runtime.connect({
                    name: 'contextMenus'
                })
                if (property === 'tabContext' || property === 'tabContextAdvanced') {
                    port.postMessage({
                        refreshContextMenus: true
                    })
                }
            } catch (error) {
                console.error('Error syncing page to current setting values', error)
            }
        })
    }

    // handle duplicate location setting explicitly
    let browserDefault = document.querySelector('#duplicateLocationBrowser')
    let right = document.querySelector('#duplicateLocationRight')
    let afterCurrent = document.querySelector('#duplicateLocationAfterCurrent')

    let duplicateLocation = await settings.local.getKeyValue('duplicateLocation')
    for (let radioButton of [browserDefault, right, afterCurrent]) {
        radioButton.checked = duplicateLocation === radioButton.value
    }

    let updateRadioGroup = async () => {
        for (let radioButton of [browserDefault, right, afterCurrent]) {
            if (radioButton.checked) {
                await settings.local.setKeyValue('duplicateLocation', radioButton.value)
            }
        }
    }
    browserDefault.addEventListener('change', updateRadioGroup)
    right.addEventListener('change', updateRadioGroup)
    afterCurrent.addEventListener('change', updateRadioGroup)

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

    try {
        let isAllowedPrivateBrowsing = await browser.extension.isAllowedIncognitoAccess()
        if (!isAllowedPrivateBrowsing) {
            document.querySelector('#privateBrowsingPermission').classList.remove('hidden')
        }
    } catch (error) {
        console.error('Querying incognito access failed', error)
    }
})
