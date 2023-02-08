import core from '/core/script.js'
import defaults from '/settings/defaults.js'

function browserSupportsDuplicate() {
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1515455
    // Not supported on Android despite documentation saying otherwise on MDN
    return browser.tabs.duplicate !== undefined
}

/*
 * A tab deleter that can only delete the target once even if called multiple
 * times.
 */
class IdempotentTabDeleter {
    constructor(tab) {
        this.tab = tab
        this.performed = false
    }

    run() {
        if (this.performed === false) {
            browser.tabs.remove(this.tab.id)
            this.performed = true
        }
    }
}

// FIXME: Don't hold state here while waiting for Advanced Duplication page
// to be interacted with, instead the state should be saved using the storage
// APIs and all this logic should be purely functional

class DuplicationLogic {
    constructor() {
        this.duplicateTab = (oldTab) => {
            if (!browserSupportsDuplicate()) {
                // duplicate by creating new tab with same URL
                // we set the active field depending on the switch focus setting
                core.settings.doIf('switchFocus', defaults, () => {
                    browser.tabs.create({
                        url: oldTab.url,
                        active: true
                    }).catch(core.expect(
                        'Failed to create new active tab with URL as fallback'))
                }, () => {
                  browser.tabs.create({
                    url: oldTab.url,
                    active: false
                }).catch(core.expect(
                    'Failed to create new tab with URL as fallback'))
                })
                return
            }
            browser.storage.local.get(['switchFocus', 'duplicateLocation']).then((results) => {
                let switchFocus = defaults['switchFocus']
                if ('switchFocus' in results) {
                    switchFocus = results['switchFocus']
                }
                let duplicateLocation = defaults['duplicateLocation']
                if ('duplicateLocation' in results) {
                    duplicateLocation = results['duplicateLocation']
                }
                let duplicateProperties = {}
                //console.log('duplicate location ', duplicateLocation)
                duplicateProperties.active = switchFocus
                // if the browser is set to send to end, and we are configured
                // to place after current, we need to set this before duplicating
                // otherwise the UX is choppy due to the browser moving the tab
                // around
                if (duplicateLocation === 'afterCurrent') {
                    duplicateProperties.index = oldTab.index + 1
                }
                browser.tabs.duplicate(oldTab.id, duplicateProperties)
                    .then((tab) => {
                        if (duplicateLocation === 'right') {
                            // For some reason -1 sends to start when passed to
                            // duplicate, but sends to end when passed to move
                            // so we have to move the tab after duplicating
                            browser.tabs.move(tab.id, {index: -1})
                                .catch(core.expect('Failed to move tab to end'))
                        }
                    })
                    .catch(core.expect('Failed to duplicate tab'))
            }).catch(core.expect('Failed to get local storage settings'))
        }

        this.advancedDuplicateTab = (oldTab) => {
            browser.tabs.create({
                url: '/page/page.html',
                active: true,
                // Place the duplicate WebExtension page just after the tab
                index: oldTab.index + 1
            }).then((tab) => {
                browser.scripting.executeScript(tab.id, {
                    files: ['/page/script.js']
                }).then(() => {
                    // Send the WebExtension page the old tab's URL
                    browser.tabs.sendMessage(tab.id, {
                        url: oldTab.url,
                        incognito: oldTab.incognito
                    })
                    // Notify the WebExtension page if incognito permission is granted
                    browser.extension.isAllowedIncognitoAccess().then((isAllowed) => {
                        browser.tabs.sendMessage(tab.id, {
                            incognitoAccessQuery: true,
                            allowedIncognitoAccess: isAllowed
                        })
                    }).catch(core.expect('Querying incognito access'))

                    let tabDeleter = new IdempotentTabDeleter(tab)
                    let listener = this.createAdvancedDuplicationTabListener(oldTab, tabDeleter)
                    // Close the page automatically if the user tabs out of it
                    browser.tabs.onActivated.addListener(function switchTab() {
                        browser.tabs.onActivated.removeListener(switchTab)
                        browser.runtime.onMessage.removeListener(listener)
                        tabDeleter.run()
                    })
                    // Listen to the WebExtension page for a button click
                    browser.runtime.onMessage.addListener(listener)
                }).catch(core.expect(
                    'Failed to inject JS into WebExtension page'))
            }).catch(core.expect(
                'Failed to create WebExtension page'))
        }

        /*
         * Creates a function which responds to the request made on the WebExtension
         * page to perform the chosen duplication action.
         */
        this.createAdvancedDuplicationTabListener = (oldTab, tabDeleter) => {
            let listener = (request) => {
                if (request.selected === 'normal') {
                    // check for existing non incognito tab
                    if (oldTab.incognito) {
                        // must create new tab from old tab's url
                        // as can't move tabs between the windows
                        browser.windows.getAll({
                            windowTypes: ['normal']
                        }).then((windows) => {
                            let normalWindows = windows.filter(w => !w.incognito)
                            if (normalWindows.length > 0) {
                                browser.storage.local.get('switchFocus').then((results) => {
                                    let switchFocus = defaults['switchFocus']
                                    if ('switchFocus' in results) {
                                        switchFocus = results['switchFocus']
                                    }
                                    // use an existing private window
                                    // assume that the windows are ordered by FF
                                    // in some meaningful way, can't see any defined
                                    // order on MDN so just use the first one.
                                    // it is probably z order which is what we want.
                                    browser.tabs.create({
                                        url: oldTab.url,
                                        active: switchFocus,
                                        windowId: normalWindows[0].id
                                    }).then((_) => {
                                        // Focus the window we just created a tab for
                                        browser.windows.update(normalWindows[0].id, {
                                            focused: true
                                        }).catch(core.expect('Failed to focus normal window'))
                                    }).catch(
                                        core.expect('Failed to create normal tab in existing window'))
                                }).catch(core.expect('Failed to get local storage settings'))
                            } else {
                                // need to create the normal window
                                browser.windows.create({
                                    incognito: false,
                                    url: [ oldTab.url ]
                                }).catch(core.expect('Failed to create window from old URL'))
                            }
                        }).catch(core.expect("Failed to get the browser's windows"))
                    } else {
                        // can duplicate the old tab
                        this.duplicateTab(oldTab)
                    }
                }
                if (request.selected === 'private') {
                    // check for existing incognito tab
                    if (oldTab.incognito) {
                        // can duplicate the old tab
                        this.duplicateTab(oldTab)
                    } else {
                        // must create new tab from old tab's url
                        // as can't move tabs between the windows
                        browser.windows.getAll({
                            windowTypes: ['normal']
                        }).then((windows) => {
                            let incognitoWindows = windows.filter(w => w.incognito)
                            if (incognitoWindows.length > 0) {
                                browser.storage.local.get('switchFocus').then((results) => {
                                    let switchFocus = defaults['switchFocus']
                                    if ('switchFocus' in results) {
                                        switchFocus = results['switchFocus']
                                    }
                                    // use an existing private window
                                    // assume that the windows are ordered by FF
                                    // in some meaningful way, can't see any defined
                                    // order on MDN so just use the first one.
                                    // it is probably z order which is what we want.
                                    browser.tabs.create({
                                        url: oldTab.url,
                                        active: switchFocus,
                                        windowId: incognitoWindows[0].id
                                    }).then((_) => {
                                        // Focus the window we just created a tab for
                                        browser.windows.update(incognitoWindows[0].id, {
                                            focused: true
                                        }).catch(core.expect('Failed to focus incognito window'))
                                    }).catch(core.expect('Failed to create incognito tab in existing window'))
                                }).catch(core.expect('Failed to get local storage settings'))
                            } else {
                                // need to create the incognito window
                                browser.windows.create({
                                    incognito: true,
                                    url: [ oldTab.url ]
                                }).catch(core.expect('Failed to create incognito window from old URL'))
                            }
                        }).catch(core.expect("Failed to get the browser's windows"))
                    }
                }
                if (request.selected === 'window') {
                    // always create window of same type as old tab
                    browser.windows.create({
                        incognito: !!oldTab.incognito,
                        url: [ oldTab.url ]
                    }).catch(core.expect('Failed to create new window from old URL'))
                }
                // close advanced duplication
                tabDeleter.run()
                browser.runtime.onMessage.removeListener(listener)
            }
            return listener
        }
    }
}

let instance = new DuplicationLogic()

export default instance
