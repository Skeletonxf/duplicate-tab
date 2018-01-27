"use strict";

document.addEventListener("DOMContentLoaded", () => {
  syncPage(defaults)
})

for (let property in defaults) {
  document.querySelector("#" + property).addEventListener("change", () => {
    syncLocalStorage(property)
  })
}
