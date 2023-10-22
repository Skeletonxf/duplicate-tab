import defaults from '/settings/defaults.js'

class Settings {
    constructor(storageArea /* local | session */) {
        this.storageArea = storageArea
    }

    /**
     * Returns the value of a key in local storage, falling back to default
     * values if it is missing.
     */
    async getKeyValue(
        setting /* string */
    ) /* -> depends on what is stored */ {
        let results = await this.storageArea.get(setting)
        if (setting in results) {
            return results[setting]
        } else {
            return defaults[setting]
        }
    }

    /**
     * Returns an object of values of multiple keys in local storage, falling
     * back to default values if it is missing.
     */
    async getMultipleKeyValues(
        settings /* [string] */
    ) /* -> {depends on what is stored} */ {
        let results = await this.storageArea.get(settings)
        for (const setting of settings) {
            let found = false;
            if (setting in results) {
                found = true;
            }
            if (!found) {
                results[setting] = defaults[setting]
            }
        }
        return results
    }

    /**
     * Sets the value of a key in local storage.
     */
    async setKeyValue(key, /* string */ value /* anything JSONifiable */) {
        let setting = {}
        setting[key] = value
        await this.storageArea.set(setting)
    }
}

let local = new Settings(browser.storage.local)
let session = new Settings(browser.storage.session)

export default {
    local: local,
    session: session
}
