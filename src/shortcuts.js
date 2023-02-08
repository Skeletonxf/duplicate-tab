export default class Shortcuts {
    async duplicateActiveTab(listener /* (Tab) -> () */) {
        let tabs = await browser.tabs.query({
            active: true,
            currentWindow: true
        })
        // get the first (only) tab in the array to duplicate
        let tab = tabs[0]
        listener(tab)
    }

    registerKeyboardShortcuts(
        normalListener /* (Tab) -> () */,
        advancedListener /* (Tab) -> () */
    ) {
        // will be undefined on android
        if (browser.commands) {
            browser.commands.onCommand.addListener((command) => {
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
