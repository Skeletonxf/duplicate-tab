let normalTab = document.getElementById('normal')
let privateTab = document.getElementById('private')

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
