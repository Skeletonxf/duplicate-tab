"use strict";

function logError(e) {
  console.log(`Error: ${e}`)
}

let defaults = {
  switchFocus : true,
  tabContext : false,
  keyboardShortcutEnabled : true
}

function restore() {
  for (let property in defaults) {
    browser.storage.local.get(property).then((r) => {
      let value = defaults[property]
      if (property in r) {
        value = r[property]
      }
      document.querySelector("#" + property).checked = value
    }, logError)
  }
}

function set(field) {
  let setting = {}
  setting[field] = document.querySelector("#" + field).checked
  browser.storage.local.set(setting)
}

document.addEventListener("DOMContentLoaded", restore)

for (let property in defaults) {
  document.querySelector("#" + property).addEventListener("change", () => {
    set(property)
  })
}

