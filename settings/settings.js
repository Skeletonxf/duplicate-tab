"use strict";

document.addEventListener("DOMContentLoaded", () => {
  syncPage(defaults)
})

for (let property in defaults) {
  document.querySelector("#" + property).addEventListener("change", () => {
    syncLocalStorage(property)
  })
}

ShortcutCustomizeUI.build().then(list => {
  // append the ui to the shortcuts div
  document.getElementById('shortcuts').appendChild(list)
})
