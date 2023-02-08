const contextMenuId = 'duplicate-menu'
const contextMenuAdvancedId = 'duplicate-advanced-menu'

export default class ContextMenus {
    // TODO: Icon support here would help distinguish between Duplicate Tab
    // and the normal browser actions

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

    #addContextMenu(id, title, listener) {
        browser.contextMenus.create({
            id: id,
            title: title,
            contexts: [ 'tab' ]
        })
        browser.contextMenus.onClicked.addListener((info, tab) => {
            if (info.menuItemId === id) {
                listener(tab)
            }
        })
    }

    #removeContextMenu(id, listener) {
        browser.contextMenus.remove(id)
        browser.contextMenus.onClicked.removeListener(listener)
    }
}
