import console from '/src/logger.js'
import settings from '/src/settings.js'
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

let refreshContextMenus = async () => {
    // will be undefined on android
    if (browser.contextMenus) {
        try {
            const { tabContext, tabContextAdvanced } = await settings
                .local
                .getMultipleKeyValues(['tabContext', 'tabContextAdvanced' ])
            if (tabContext === true) {
                contextMenus.addNormalContextMenu(duplicate)
            } else {
                contextMenus.removeNormalContextMenu(duplicate)
            }
            if (tabContextAdvanced === true) {
                contextMenus.addAdvancedContextMenu(launchAdvancedDuplication)
            } else {
                contextMenus.removeAdvancedContextMenu(launchAdvancedDuplication)
            }
        } catch (error) {
            console.error('Failed to get UI settings', error)
        }
    }
}

browser.runtime.onInstalled.addListener(() => {
    console.log('Installed')
    refreshContextMenus()
    duplicateTab.onInstalled()
})

browser.runtime.onStartup.addListener(() => {
    console.log('Started')
    duplicateTab.onStartup()
})

browser.runtime.onSuspend.addListener(() => {
    console.log('Suspending')
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
let openOptionsPage = async () => {
    try {
        await browser.runtime.openOptionsPage()
    } catch (error) {
        console.error('Failed to open options page', error)
    }
    return true
}
browser.runtime.onMessage.addListener((data, sender) => {
    // From MDN: If you only want the listener to respond to messages of a
    // certain type, you must define the listener as a non-async function,
    // and return a Promise only for the messages the listener is meant to
    // respond to and otherwise return false or undefined:
    if (data.openOptionsPage === true) {
        return openOptionsPage()
    } else {
        return false;
    }
})
