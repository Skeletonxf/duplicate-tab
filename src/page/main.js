console.log('Page script initialising')

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

console.log('Adding listeners')

browser.runtime.onMessage.addListener(function urlListener(request) {
    if (request.url) {
        document.getElementById('header').textContent += (' ' + request.url + ' into:')

        // try to auto detect privileged urls that can't be transfered
        // into/out of private windows
        {
            let privileged = false
            let url = request.url.toLowerCase()
            if (!url.includes('http:') && !url.includes('https:')) {
                privileged = url.includes('about:debugging')
                || url.includes('about:addons')
                || url.includes('about:config')
                || url.includes('about:newtab')
            }
            if (privileged) {
                // can't create privileged tabs so transfering between windows
                // doesn't work, but can still duplicate them.
                if (request.incognito) {
                    buttons.get('normal').deleter.run()
                } else {
                    buttons.get('private').deleter.run()
                }
                buttons.get('window').deleter.run()

                document.querySelector('#privilegedTab').classList.remove('hidden')
            }
        }

        browser.runtime.onMessage.removeListener(urlListener)

        // also style new window button to type of window to create
        if (request.incognito) {
            buttons.get('window').element.classList.add('private-style')
            buttons.get('window').element.classList.remove('normal-style')
        }
    }
})

browser.runtime.onMessage.addListener(function incognitoAccessListener(request) {
    if (request.incognitoAccessQuery) {
        if (request.allowedIncognitoAccess === false) {
            // the only case that needs user notification is moving
            // a non incognito tab to an incognito window because
            // if incognito permissions are not given it is impossible
            // to launch the advanced duplication tab in a private
            // window
            buttons.get('private').deleter.run()

            document.querySelector('#privateBrowsingPermission').classList.remove('hidden')

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

        browser.runtime.onMessage.removeListener(incognitoAccessListener)
    }
})

console.log('Finished adding listeners')

buttons.get('normal').element.focus()

buttons.forEach((b) => {
    b.element.addEventListener('mouseenter', () => {
        b.element.focus()
    })

    b.element.addEventListener('click', () => {
        browser.runtime.sendMessage({
            selected: b.id
        })
    })

    b.element.addEventListener('keypress', (event) => {
        // only select with enter on the focused element
        if (b.element === document.activeElement && event.key === 'Enter') {
            browser.runtime.sendMessage({
                selected: b.id
            })
        }
    })

    // listen on the body to detect all shortcut keys regardless of focus
    document.body.addEventListener('keypress', (event) => {
        if (b.shortcuts.includes(event.key)) {
            browser.runtime.sendMessage({
                selected: b.id
            })
        }
    })
})

console.log('Finished executing')
