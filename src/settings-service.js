class SettingsService {
    constructor() {
        this.MY_NAME_KEY = 'myName';
        this.ADD_RE_KEY = 'addRe';
        this.SENTIMENT_KEY = 'sentiment';
    }

    async getMyName() {
        return new Promise((resolve) => {
            chrome.storage.local.get([this.MY_NAME_KEY], (result) => {
                resolve(result[this.MY_NAME_KEY] || '');
            });
        });
    }

    async setMyName(name) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [this.MY_NAME_KEY]: name }, () => {
                resolve();
            });
        });
    }

    async getAddRe() {
        return new Promise((resolve) => {
            chrome.storage.local.get([this.ADD_RE_KEY], (result) => {
                resolve(result[this.ADD_RE_KEY] || false);
            });
        });
    }

    async setAddRe(value) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [this.ADD_RE_KEY]: value }, () => {
                resolve();
            });
        });
    }

    async getSentiment() {
        return new Promise((resolve) => {
            chrome.storage.local.get([this.SENTIMENT_KEY], (result) => {
                resolve(result[this.SENTIMENT_KEY] || 'neutral');
            });
        });
    }

    async setSentiment(value) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [this.SENTIMENT_KEY]: value }, () => {
                resolve();
            });
        });
    }
}

export default new SettingsService(); 