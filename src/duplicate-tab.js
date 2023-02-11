import settings from '/src/settings.js'

const advancedDuplicateTabPage = 'advanced-duplication-page-tab-id'
const oldTabData = 'old-tab-data'

function browserSupportsDuplicate() {
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1515455
    // Not supported on Android despite documentation saying otherwise on MDN
    return browser.tabs.duplicate !== undefined
}

export default class DuplicateTab {
    /**
     * Normal tab duplication that uses the duplicate browser API
     */
    async duplicate(oldTab /* Tab */) {
        if (!browserSupportsDuplicate()) {
            return await this.#createNewTab(oldTab)
        }
        const { switchFocus, duplicateLocation } = await settings
            .getMultipleKeyValues(['switchFocus', 'duplicateLocation'])
        let duplicateProperties = {
            active: switchFocus
        }
        // if the browser is set to send to end, and we are configured
        // to place after current, we need to set this before duplicating
        // otherwise the UX is choppy due to the browser moving the tab
        // around
        if (duplicateLocation === 'afterCurrent') {
            duplicateProperties.index = oldTab.index + 1
        }
        let tab = await browser.tabs.duplicate(oldTab.id, duplicateProperties)
        if (duplicateLocation === 'right') {
            // For some reason -1 sends to start when passed to
            // duplicate, but sends to end when passed to move
            // so we have to move the tab after duplicating
            await browser.tabs.move(tab.id, {index: -1})
        }
    }

    async #createNewTab(oldTab) {
        // duplicate by creating new tab with same URL
        // we set the active field depending on the switch focus setting
        let switchFocus = await settings.getKeyValue('switchFocus')
        await browser.tabs.create({
            url: oldTab.url,
            active: switchFocus
        })
    }

    async launchAdvancedDuplication(oldTab /* Tab */) {
        await settings.setKeyValue(oldTabData, {
            url: oldTab.url,
            incognito: oldTab.incognito,
            id: oldTab.id
        })
        let tab = await browser.tabs.create({
            url: '/src/page/page.html',
            active: true,
            // Place the duplicate WebExtension page just after the tab
            index: oldTab.index + 1
        })
        // Since we could be unloaded while the page is open, save the tab ID
        // to local storage.
        // Once session storage is supported, we should use that instead because
        // then it will match the storage duration to how long the tab ID is
        // valid for.
        // This does create a minor edge case of users closing their
        // browser with reopening windows enabled and then Duplicate Tab losing
        // the advanced duplication tab ID, but this is way less bad than
        // Duplicate Tab persisting a tab ID that clashes with a tab in a new
        // session and closing that one instead.
        await settings.setKeyValue(advancedDuplicateTabPage, tab.id)
    }

    async clearSessionTabData() {
        // TODO: Can run this in parallel
        await settings.setKeyValue(advancedDuplicateTabPage, null)
        await settings.setKeyValue(oldTabData, null)
    }

    async registerTabChanges() {
        // It would be nice to not have to listen to active tab changes except
        // for ones that belong to our extension, but I don't see any way to
        // configure this on the docs
        browser.tabs.onActivated.addListener(async (activeInfo) => {
            try {
                const { previousTabId } = activeInfo
                let id = await settings.getKeyValue(advancedDuplicateTabPage)
                if (id !== null && id !== undefined && previousTabId === id) {
                    // If the advanced duplication page is no longer active, we
                    // should automatically remove it.
                    await this.#closeAdvancedDuplicationPageAndClearData(id)
                }
            } catch (error) {
                console.error('Error listening to onActivated changes', error)
            }
        })
    }

    async #closeAdvancedDuplicationPageAndClearData(id) {
        await browser.tabs.remove(id)
        await this.clearSessionTabData()
    }

    registerMessageListening() {
        // From MDN: If you only want the listener to respond to messages of a
        // certain type, you must define the listener as a non-async function,
        // and return a Promise only for the messages the listener is meant to
        // respond to — and otherwise return false or undefined:
        browser.runtime.onMessage.addListener((data, sender) => {
            if (data.type === "page") {
                return this.#respondToPage(data, sender)
            } else {
                return false;
            }
        })
    }

    async #respondToPage(data, sender) {
        try {
            const { url, incognito, id } = await settings.getKeyValue(oldTabData)
            if (data.selected === 'normal') {
                console.log('normal duplication requested')
                if (incognito === false) {
                    await this.#duplicateSameTypeOfTab(id)
                    return true;
                }
            }
            if (data.selected === 'private') {
                console.log('private duplication requested')
                if (incognito === true) {
                    await this.#duplicateSameTypeOfTab(id)
                    return true;
                }
            }
            if (data.selected === 'window') {
                console.log('window duplication requested')
                return true;
            }
            if (data.getPageData === true) {
                return {
                    url: url,
                    oldTabIsIncognito: incognito,
                    allowedIncognitoAccess: await browser.extension.isAllowedIncognitoAccess()
                }
            }
        } catch (error) {
            console.error('Error responding to page', error)
        }
    }

    async #duplicateSameTypeOfTab(id) {
        await this.duplicate(await browser.tabs.get(id))
    }
}
