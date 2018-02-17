# webextensions-lib-shortcut-customize-ui

Generates configuration UI for keyboard shortcuts, for WebExtensions-based Firefox addons.

## Screenshots

![(Screenshot of generated UI)](screenshot.png)

## Basic usage

Load the file `ShortcutCustomizeUI.js` from any document (options page, sidebar panel, or browser action panel), like:

```json
<script type="application/javascript" src="./ShortcutCustomizeUI.js"></script>
```

And, call `ShortcutCustomizeUI.build()`. It returns a promise resolved with a DOM element:

```javascript
ShortcutCustomizeUI.build().then(list => {
  document.getElementById('shortcuts').appendChild(list);
});
```

## Need controbution for internalitonalization

By default, shortcut keys and modifier keys are shown with [their general name listed at the API document](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json/commands#Shortcut_values), but such raw key names may confuse people in some locales. Thus this project needs more help for internationalization/localization. Please pull requests to update [the built-in definitions for localized key names](https://github.com/piroor/webextensions-lib-shortcut-customize-ui/blob/master/ShortcutCustomizeUI.js#L269).
