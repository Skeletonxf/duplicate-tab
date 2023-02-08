import core from '/core/script.js'
import duplication from '/background/duplication.js'
import defaults from '/settings/defaults.js'
import ContextMenus from '/src/context-menus.js'
import Shortcuts from '/src/shortcuts.js'

// listen for clicks on the icon to run the duplicate function
browser.browserAction.onClicked.addListener(duplication.duplicateTab)

let contextMenus = new ContextMenus()
let shortcuts = new Shortcuts()

contextMenus.registerNormalContextMenu(duplication.duplicateTab)
contextMenus.registerAdvancedContextMenu(duplication.advancedDuplicateTab)
shortcuts.registerKeyboardShortcuts(
    duplication.duplicateTab,
    duplication.advancedDuplicateTab
)

function refreshContextMenus() {
    // will be undefined on android
    if (browser.contextMenus) {
        core.settings.doIf(
            'tabContext',
            defaults,
            () => { contextMenus.addNormalContextMenu(duplication.duplicateTab) },
            () => { contextMenus.removeNormalContextMenu(duplication.duplicateTab) }
        )
        core.settings.doIf(
            'tabContextAdvanced',
            defaults,
            () => { contextMenus.addAdvancedContextMenu(duplication.advancedDuplicateTab) },
            () => { contextMenus.removeAdvancedContextMenu(duplication.advancedDuplicateTab) }
        )
    }
}

browser.runtime.onInstalled.addListener(() => {
    refreshContextMenus()
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
