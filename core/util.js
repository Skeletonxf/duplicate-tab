"use strict";

// Utility functions shared between webextensions
// Currently shared between Duplicate Tab and Image Extract
// If this grows significantly it may best moved to a gitsubmodule

/*
 * A function that returns a function that logs an
 * error it received and includes the custom message
 * given to this function to identify the line where
 * the error occured.
 * @param msg The uniquely identifying message
 */
function expect(msg) {
  return (error) => console.log(`Error: ${error}, at: ${msg}`)
}

/*
 * deprecated
 */
function logError(e) {
  console.log(`Error: ${e}`)
}

class DevConsole {
  constructor(isDebug) {
    this.isDebug = isDebug
  }
  log(msg) {
    if (this.isDebug) {
      console.log(msg)
    }
  }
}
const devConsole = new DevConsole(false)

/**
 * doIf executes the action if the setting
 * resolves to true, and executes the ifNot
 * action if the setting resolves to false
 * The setting will resolve to either its
 * set value in local storage of the browser
 * or the default value in defaults if no
 * value in local storage
 * @param setting
 * @param action
 * @param ifNot
 * @returns
 */
function doIf(setting, defaults, action, ifNot) {
  browser.storage.local.get(setting).then((r) => {
    let doAction = defaults[setting]
    // check user setting
    if (setting in r) {
      doAction = r[setting]
    }
    if (doAction) {
      action()
    } else {
      if (ifNot) {
        ifNot()
      }
    }
  }, logError)
}

/**
 * Sets a list of attributes onto an element.
 * @param element element to set attributes on
 * @param attributes list of objects where name field
 *  is attribute name and value field is value of attribute to set.
 */
function setAttributes(element, attributes) {
  attributes.forEach((attribute) => {
    element.setAttribute(attribute.name, attribute.value)
  })
}

/**
 * Syncs the page to the values of these properties
 *
 * @param properties properties to update to
 * @returns nothing
 */
function syncPage(properties) {
  for (let property in properties) {
    browser.storage.local.get(property).then((r) => {
      let value = properties[property]
      if (property in r) {
        value = r[property]
      }
      document.querySelector("#" + property).checked = value
    }, logError)
  }
}

/**
 * Syncs the corresponding local storage setting
 * to this value on the page
 * @param field field to sync local storage to
 * @returns nothing
 */
function syncLocalStorage(property) {
  let setting = {}
  setting[property] = document.querySelector("#" + property).checked
  browser.storage.local.set(setting)
  devConsole.log(setting)
}
