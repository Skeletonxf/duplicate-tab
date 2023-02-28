import settings from '/src/settings.js'
import console from '/src/logger.js'

const advancedDuplicateTabPage = 'advanced-duplication-page-tab-id'
const oldTabData = 'old-tab-data'
const startups = 'startup-number'

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
            id: oldTab.id,
            // bundle the current startup number with the tab ID so we can
            // disambiguate tab IDs between different sessions in lieu of
            // session storage API support
            startup: await this.#getStartupCount(),
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
        await settings.setKeyValue(advancedDuplicateTabPage, null)
        await settings.setKeyValue(oldTabData, null)
    }

    async onStartup() {
        await this.#incrementStartups()
    }

    async onInstalled() {
        await this.#incrementStartups()
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
                    const { startup } = await settings.getKeyValue(oldTabData)
                    let startupNow = await this.#getStartupCount()
                    if (startup === startupNow) {
                        await this.#closeAdvancedDuplicationPageAndClearData(id)
                    } else {
                        console.error(
                            'Session in which tab ID was saved is most likely not the current session',
                            id, startup, startupNow
                        )
                        await this.clearSessionTabData()
                    }
                }
            } catch (error) {
                console.error('Error listening to onActivated changes', error)
            }
        })
    }

    async #closeAdvancedDuplicationPageAndClearData(
        id /* Tab id of the Duplicate Tab UI page */
    ) {
        await browser.tabs.remove(id)
        await this.clearSessionTabData()
    }

    async #getAndCloseAdvancedDuplicationPageAndClearData() {
        let id = await settings.getKeyValue(advancedDuplicateTabPage)
        if (id !== null && id !== undefined) {
            await this.#closeAdvancedDuplicationPageAndClearData(id)
        }
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
                if (incognito === false) {
                    await this.#duplicateSameTypeOfTab(id)
                } else {
                    await this.#createNewTabInWindow(url, false, true)
                    await this.#getAndCloseAdvancedDuplicationPageAndClearData()
                }
                return true
            }
            if (data.selected === 'private') {
                if (incognito === true) {
                    await this.#duplicateSameTypeOfTab(id)
                } else {
                    await this.#createNewTabInWindow(url, true, true)
                    await this.#getAndCloseAdvancedDuplicationPageAndClearData()
                }
                return true
            }
            if (data.selected === 'window' || data.selected === 'move-window') {
                await this.#createNewTabInWindow(url, incognito, false)
                if (data.selected === 'move-window') {
                    await browser.tabs.remove(id)
                }
                await this.#getAndCloseAdvancedDuplicationPageAndClearData()
                return true
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
            await this.#getAndCloseAdvancedDuplicationPageAndClearData()
            return true
        }
    }

    async #duplicateSameTypeOfTab(id) {
        await this.duplicate(await browser.tabs.get(id))
    }

    async #createNewTabInWindow(url, incognito, useExistingWindows) {
        if (useExistingWindows) {
            let switchFocus = await settings.getKeyValue('switchFocus')
            let windows = (await browser.windows.getAll({
                windowTypes: ['normal']
            })).filter(w => w.incognito === incognito)
            if (windows.length > 0) {
                // use an existing private window, assuming that the windows are
                // ordered by FF in some meaningful way, I can't see any defined
                // order on MDN so just use the first one. It is probably z
                // order which is what we want.
                await browser.tabs.create({
                    url: url,
                    active: switchFocus,
                    windowId: windows[0].id
                })
                // Focus the window we just created a tab for
                await browser.windows.update(windows[0].id, { focused: true })
                return
            }
        }
        // otherwise make a new window of the correct type, if there are none
        // existing or we don't want to use existing windows
        await browser.windows.create({
            incognito: incognito,
            url: [ url ]
        })
    }

    async #getStartupCount() {
        let count = await settings.getKeyValue(startups)
        if (count === null || count === undefined) {
            return -1
        } else {
            return count
        }
    }

    async #incrementStartups() {
        let count = await settings.getKeyValue(startups)
        if (count !== null && count !== undefined) {
            // Cycle back to 0 because we don't actually need to track the real
            // number, just a second bit of data to disambiguate tab IDs between
            // sessions
            if (count > 100) {
                console.log('Startup #', 0)
                await settings.setKeyValue(startups, 0)
            } else {
                console.log('Startup #', count + 1)
                await settings.setKeyValue(startups, count + 1)
            }
        } else {
            console.log('Startup #', 0)
            await settings.setKeyValue(startups, 0)
        }
    }
}
