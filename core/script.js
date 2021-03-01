const IS_DEBUG = false

/*
 * A singleton utility class providing helper functions for Duplicate Tab
 * and Image Extract. At present this is simply updated to both repositories
 * when either copy is changed.
 */
class Core {
    constructor(isDebug) {
        this.isDebug = isDebug
        /*
         * The settings part of the core module, with helper functions for
         * manipulating browser settings.
         */
        this.settings = {
            /**
             * doIf executes the action if the setting resolves to true, and
             * executes the ifNot action if the setting resolves to false.
             *
             * The setting will resolve to either its set value in local storage
             * of the browser or the default value in the defaults object if
             * there is no value set in local storage.
             * @param setting query string
             * @param defaults object with field providing default value for
             *                 query string
             * @param action function to call if setting resolves to true
             * @param ifNot optional function to call if setting resolves to
             *              false
             */
            doIf: (setting, defaults, action, ifNot) => {
                browser.storage.local.get(setting).then((results) => {
                    let doAction = defaults[setting]
                    // check user setting
                    if (setting in results) {
                        doAction = results[setting]
                    }
                    if (doAction) {
                        action()
                    } else if (ifNot) {
                        ifNot()
                    }
                }, this.expect('core.settings.doIf'))
            },
            /**
             * Syncs the property checkboxes on the webpage to the default values
             * of these properties from local storage or their default value.
             */
            syncPage: (properties, ignoreList) => {
                for (let property in properties) {
                    if (ignoreList.includes(property)) {
                        continue
                    }
                    browser.storage.local.get(property).then((result) => {
                        let value = properties[property]
                        if (property in result) {
                            value = result[property]
                        }
                        document.querySelector("#" + property).checked = value
                    }).catch(this.expect('core.settings.syncPage'))
                }
            }
        }
        /*
         * Simple logging utility that is turned off on release
         */
        this.log = (msg) => {
            if (this.isDebug) {
                console.log(msg)
            }
        }

        /*
         * A function that returns a function that logs an
         * error it received and includes the custom message
         * given to this function to identify the line where
         * the error occured.
         * @param msg The uniquely identifying message
         */
        this.expect = (msg) => {
            return (error) => this.log(`Error: ${error}, at: ${msg}`)
        }
    }
}

let instance = new Core(IS_DEBUG)

export default instance
