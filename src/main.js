import core from '/core/script.js'
//import duplication from '/background/duplication.js'
import defaults from '/settings/defaults.js'
import ContextMenus from '/src/context-menus.js'
import Shortcuts from '/src/shortcuts.js'
import DuplicateTab from '/src/duplicate-tab.js'

let contextMenus = new ContextMenus()
let shortcuts = new Shortcuts()
let duplicateTab = new DuplicateTab()

let duplicate = duplicateTab.duplicate.bind(duplicateTab)
let launchAdvancedDuplication = duplicateTab.launchAdvancedDuplication.bind(duplicateTab)

contextMenus.registerNormalContextMenu(duplicate)
contextMenus.registerAdvancedContextMenu(launchAdvancedDuplication)
shortcuts.registerKeyboardShortcuts(duplicate, launchAdvancedDuplication)
duplicateTab.registerTabChanges()
duplicateTab.registerMessageListening()

// listen for clicks on the icon to run the duplicate function
browser.action.onClicked.addListener(duplicateTab.duplicate)

function refreshContextMenus() {
    // will be undefined on android
    if (browser.contextMenus) {
        core.settings.doIf(
            'tabContext',
            defaults,
            () => { contextMenus.addNormalContextMenu(duplicate) },
            () => { contextMenus.removeNormalContextMenu(duplicate) }
        )
        core.settings.doIf(
            'tabContextAdvanced',
            defaults,
            () => { contextMenus.addAdvancedContextMenu(launchAdvancedDuplication) },
            () => { contextMenus.removeAdvancedContextMenu(launchAdvancedDuplication) }
        )
    }
}

browser.runtime.onInstalled.addListener(() => {
    console.log('Installed')
    refreshContextMenus()
    duplicateTab.clearSessionTabData()
})

browser.runtime.onStartup.addListener(() => {
    console.log('Started')
    duplicateTab.clearSessionTabData()
})

browser.runtime.onSuspend.addListener(() => {
    console.log('Suspending')
    // FIXME: switch to session storage once supported
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/session
    duplicateTab.clearSessionTabData()
})

// Expose a way to refresh the context menus (which can only be done from this
// background script) from other places like the settings page
browser.runtime.onConnect.addListener((port) => {
    if (port.name === 'contextMenus') {
        port.onMessage.addListener((msg) => {
            if (msg.refreshContextMenus) {
                refreshContextMenus()
            }
        })
    }
})

// Expose a way to open the options page from the content script when informing
// user of settings that need modification
browser.runtime.onConnect.addListener((port) => {
    if (port.name === 'optionsPage') {
        port.onMessage.addListener((msg) => {
            if (msg.openOptionsPage) {
                browser.runtime.openOptionsPage().then(() => {
                }).catch(core.expect('Failed to open options page'))
            }
        })
    }
})
