const contextMenuId = 'duplicate-menu'
const contextMenuAdvancedId = 'duplicate-advanced-menu'

export default class ContextMenus {
    // TODO: Icon support here would help distinguish between Duplicate Tab
    // and the normal browser actions

    registerNormalContextMenu(listener /* (Tab) -> () */) {
        this.#registerContextMenu(contextMenuId, listener)
    }

    registerAdvancedContextMenu(listener /* (Tab) -> () */) {
        this.#registerContextMenu(contextMenuAdvancedId, listener)
    }

    addNormalContextMenu(listener /* (Tab) -> () */) {
        this.#addContextMenu(contextMenuId, 'Duplicate', listener)
    }

    addAdvancedContextMenu(listener /* (Tab) -> () */) {
        this.#addContextMenu(contextMenuAdvancedId, 'Advanced duplicate', listener)
    }

    removeNormalContextMenu(listener /* (Tab) -> () */) {
        this.#removeContextMenu(contextMenuId, listener)
    }

    removeAdvancedContextMenu(listener /* (Tab) -> () */) {
        this.#removeContextMenu(contextMenuAdvancedId, listener)
    }

    #registerContextMenu(id, listener) {
        if (browser.contextMenus) {
            browser.contextMenus.onClicked.addListener((info, tab) => {
                if (info.menuItemId === id) {
                    listener(tab)
                }
            })
        }
    }

    #addContextMenu(id, title, listener) {
        if (browser.contextMenus) {
            browser.contextMenus.create({
                id: id,
                title: title,
                contexts: [ 'tab' ]
            })
        }
    }

    #removeContextMenu(id, listener) {
        if (browser.contextMenus) {
            browser.contextMenus.remove(id)
        }
    }
}
