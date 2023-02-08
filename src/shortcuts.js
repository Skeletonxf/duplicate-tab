export default class Shortcuts {
    async duplicateActiveTab(listener /* (Tab) -> () */) {
        let tabs = await browser.tabs.query({
            active: true,
            currentWindow: true
        })
        // get the first (only) tab in the array to duplicate
        let tab = tabs[0]
        console.log("tab is ", tab)
        listener(tab)
    }

    registerKeyboardShortcuts(
        normalListener /* (Tab) -> () */,
        advancedListener /* (Tab) -> () */
    ) {
        // will be undefined on android
        if (browser.commands) {
            browser.commands.onCommand.addListener((command) => {
                console.log("command is ", command, normalListener, advancedListener)
                if (command === 'duplicate-shortcut-1') {
                    this.duplicateActiveTab(normalListener)
                }
                if (command === 'duplicate-shortcut-2') {
                    this.duplicateActiveTab(normalListener)
                }
                if (command === 'duplicate-shortcut-3') {
                    this.duplicateActiveTab(normalListener)
                }
                if (command === 'advanced-duplicate-shortcut-1') {
                    this.duplicateActiveTab(advancedListener)
                }
            })
        }
    }
}
