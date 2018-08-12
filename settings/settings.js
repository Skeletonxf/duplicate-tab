"use strict";

let labels

// TODO populate values from defaults somehow
let shortcuts = {
  // values refer to the ith labels in the table corresponding
  // to the shortcut description
  // TODO remove magic numbers
  keyboardShortcut1Enabled: 0,
  keyboardShortcut2Enabled: 4,
  keyboardShortcut3Enabled: 8,
  advancedDuplicationShortcutEnabled: 12
}

document.addEventListener("DOMContentLoaded", () => {
  syncPage(defaults)
})

for (let property in defaults) {
  document.querySelector("#" + property).addEventListener('change', () => {
    syncLocalStorage(property)
    if (property in shortcuts) {
      labels[shortcuts[property]].classList.toggle('disabled')
    }
  })
}

ShortcutCustomizeUI.build().then(list => {
  // append the ui to the shortcuts div
  document.getElementById('shortcuts').appendChild(list)
  // get all of the customization labels added to page
  labels = document.querySelectorAll('#shortcuts ul li label')
  // now apply the enabled/disabled css to each
  for (let shortcut in shortcuts) {
    let i = shortcuts[shortcut]
    doIf(shortcut, defaults, () => {
      // do nothing as enabled
    }, () => {
      labels[i].classList.add('disabled')
    })
  }
})
