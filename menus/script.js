const contextMenuId = 'duplicate-menu'
const contextMenuAdvancedId = 'duplicate-advanced-menu'

export default class ContextMenus {
    constructor(duplicate, advancedDuplicate) {
        // Wrap each duplication logic into a test to determine if the
        // clicked context menu option is correct
        this.duplicate = (info, tab) => {
            switch (info.menuItemId) {
                case contextMenuId:
                    duplicate(tab)
                break;
            }
        }
        this.advancedDuplicate = (info, tab) => {
            switch (info.menuItemId) {
                case contextMenuAdvancedId:
                    advancedDuplicate(tab)
                break;
            }
        }

        /*
         * Adds a context menu
         */
        this.add = {
            normal: () => {
                browser.contextMenus.create({
                    id: contextMenuId,
                    title: 'Duplicate',
                    contexts: [ 'tab' ]
                })
                browser.contextMenus.onClicked.addListener(this.duplicate)
            },
            advanced: () => {
                browser.contextMenus.create({
                    id: contextMenuAdvancedId,
                      title: 'Advanced duplicate',
                      contexts: [ 'tab' ]
                })
                browser.contextMenus.onClicked.addListener(this.advancedDuplicate)
            }
        }

        /*
         * Removes a context menu, doing nothing if it didn't exist
         */
        this.remove = {
            normal: () => {
                browser.contextMenus.onClicked.removeListener(this.duplicate)
                browser.contextMenus.remove(contextMenuId)
            },
            advanced: () => {
                browser.contextMenus.onClicked.removeListener(this.advancedDuplicate)
                browser.contextMenus.remove(contextMenuAdvancedId)
            }
        }
    }
}
