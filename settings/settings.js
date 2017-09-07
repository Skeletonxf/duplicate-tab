"use strict";

function logError(e) {
  console.log(`Error: ${e}`)
}

function restore() {
  browser.storage.local.get("switchFocus").then((r) => {
    // switch focus by default
    let value = true
    if ('switchFocus' in r) {
      value = r.switchFocus
    }
    document.querySelector("#switchFocus").checked = value
  }, logError)
}

function switchFocus(e) {
  console.log("Updating switch focus setting " + document.querySelector("#switchFocus").checked)
  // update local storage
  browser.storage.local.set({
    switchFocus : document.querySelector("#switchFocus").checked
  })
}

document.addEventListener("DOMContentLoaded", restore)
document.querySelector("#switchFocus").addEventListener("change", switchFocus)
