let normalTab = document.getElementById('normal')
let privateTab = document.getElementById('private')

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
      }
      if (privileged) {
        // can't create privileged tabs so transfering between windows
        // doesn't work, but can still duplicate them.
        if (request.incognito) {
          normalTab.parentNode.removeChild(normalTab)
        } else {
          privateTab.parentNode.removeChild(privateTab)
        }
        {
          let h2 = document.createElement('h2')
          h2.appendChild(
            document.createTextNode('Where did one of my buttons go?'))
          document.body.appendChild(h2)
        }
        {
          let p = document.createElement('p')
          p.appendChild(
            document.createTextNode(
              "Your tab has a privileged url that Duplicate Tab can't create."))
          document.body.appendChild(p)
        }
      }
    }

    browser.runtime.onMessage.removeListener(urlListener)
  }
})

normalTab.focus()

normalTab.addEventListener('mouseenter', () => {
  normalTab.focus()
})
privateTab.addEventListener('mouseenter', () => {
  privateTab.focus()
})

normalTab.addEventListener('click', () => {
  browser.runtime.sendMessage({
    selected: 'normal'
  })
})
privateTab.addEventListener('click', () => {
  browser.runtime.sendMessage({
    selected: 'private'
  })
})
