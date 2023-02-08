import core from '/core/script.js'
import duplication from '/background/duplication.js'
import defaults from '/settings/defaults.js'
import ContextMenus from '/menus/context-menus.js'

/*
 * Function to determine the active tab to duplicate to then hand off to
 * duplication logic for that tab.
 */
function duplicateActiveTab(isAdvanced) {
    // get a Promise to retrieve the current tab
    var gettingActiveTab = browser.tabs.query({
        active: true,
        currentWindow: true
    })

    // get the activate tab to duplicate from the Promise
    gettingActiveTab.then((tabs) => {
        // get the first (only) tab in the array to duplicate
        let tab = tabs[0]
        if (isAdvanced) {
            duplication.advancedDuplicateTab(tab)
        } else {
            duplication.duplicateTab(tab)
        }
    }).catch(core.expect("Couldn't get the active tab"))
}

// listen for clicks on the icon to run the duplicate function
browser.browserAction.onClicked.addListener(duplication.duplicateTab)

let contextMenus = new ContextMenus()

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

// will be undefined on android
if (browser.commands) {
    browser.commands.onCommand.addListener((command) => {
        if (command === 'duplicate-shortcut-1') {
            duplicateActiveTab(false)
        }
        if (command === 'duplicate-shortcut-2') {
            duplicateActiveTab(false)
        }
        if (command === 'duplicate-shortcut-3') {
            duplicateActiveTab(false)
        }
        if (command === 'advanced-duplicate-shortcut-1') {
            duplicateActiveTab(true)
        }
    })
}
