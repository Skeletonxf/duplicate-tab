//TODO Switch to ES6 modules once available in FF by default
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export

let defaults = {
  switchFocus : true,
  tabContext : false,
  keyboardShortcut1Enabled : browser.runtime.PlatformOs != "mac"
    && browser.runtime.PlatformOs != "win",
  keyboardShortcut2Enabled : browser.runtime.PlatformOs === "mac"
    || browser.runtime.PlatformOs === "win",
  keyboardShortcut3Enabled : false,
  advancedDuplicationShortcutEnabled : false
}
