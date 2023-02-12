let buttons = new Map()
buttons.set('normal', {
    id: 'normal',
    shortcuts: ['n', '1']
})
buttons.set('private', {
    id: 'private',
    shortcuts: ['p', '2']
})
buttons.set('window', {
    id: 'window',
    shortcuts: ['w', '3']
})
buttons.set('move-window', {
    id: 'move-window',
    shortcuts: ['m', '4']
})

buttons.forEach((b) => b.element = document.getElementById(b.id))

/*
 * A DOM element deleter that can only delete the target once even if called
 * multiple times.
 */
class IdempotentElementDeleter {
    constructor(element) {
        this.element = element
        this.performed = false
    }

    run() {
        if (this.performed === false) {
            this.element.parentNode.removeChild(this.element)
            this.performed = true
        }
    }
}

buttons.forEach((b) => b.deleter = new IdempotentElementDeleter(b.element))

;(async () => {
    let response = await browser.runtime.sendMessage({
        type: 'page',
        getPageData: true
    })
    const { url } = response
    const { oldTabIsIncognito } = response
    document.getElementById('header').textContent += (' ' + url + ' into:')
    // try to auto detect privileged urls that can't be transfered
    // into/out of private windows
    {
        let privileged = false
        let lowercased = url.toLowerCase()
        if (!lowercased.includes('http:') && !lowercased.includes('https:')) {
            privileged = lowercased.includes('about:debugging')
            || lowercased.includes('about:addons')
            || lowercased.includes('about:config')
            || lowercased.includes('about:newtab')
            || lowercased.includes('about:privatebrowsing')
        }
        if (privileged) {
            // can't create privileged tabs so transfering between windows
            // doesn't work, but can still duplicate them.
            if (oldTabIsIncognito) {
                buttons.get('normal').deleter.run()
            } else {
                buttons.get('private').deleter.run()
            }
            buttons.get('window').deleter.run()
            buttons.get('move-window').deleter.run()

            document.querySelector('#privilegedTab').classList.remove('hidden')
        }
    }
    // also style new window buttons to type of window to create
    if (oldTabIsIncognito) {
        buttons.get('window').element.classList.add('private-style')
        buttons.get('window').element.classList.remove('normal-style')
        buttons.get('move-window').element.classList.add('private-style')
        buttons.get('move-window').element.classList.remove('normal-style')
    }
    const { allowedIncognitoAccess } = response
    if (allowedIncognitoAccess === false) {
        // the only case that needs user notification is moving
        // a non incognito tab to an incognito window because
        // if incognito permissions are not given it is impossible
        // to launch the advanced duplication tab in a private
        // window
        buttons.get('private').deleter.run()

        document.querySelector('#privateBrowsingPermission').classList.remove('hidden')

        // TODO: Getting this to work again
        let launcher = document.querySelector('#openOptionsPage')
        let port = browser.runtime.connect({
            name: 'optionsPage'
        })
        launcher.addEventListener('click', () => {
            port.postMessage({
                openOptionsPage: true
            })
        })
    }
})()

buttons.get('normal').element.focus()

buttons.forEach((b) => {
    b.element.addEventListener('mouseenter', () => {
        b.element.focus()
    })

    b.element.addEventListener('click', () => {
        browser.runtime.sendMessage({
            type: 'page',
            selected: b.id
        })
    })

    b.element.addEventListener('keypress', (event) => {
        // only select with enter on the focused element
        if (b.element === document.activeElement && event.key === 'Enter') {
            browser.runtime.sendMessage({
                type: 'page',
                selected: b.id
            })
        }
    })

    // listen on the body to detect all shortcut keys regardless of focus
    document.body.addEventListener('keypress', (event) => {
        if (b.shortcuts.includes(event.key)) {
            browser.runtime.sendMessage({
                type: 'page',
                selected: b.id
            })
        }
    })
})
