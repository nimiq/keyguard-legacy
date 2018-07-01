export default class TooManyAccountsSafariError extends Error {

    constructor() {
        super('Cannot store more then 10 accounts in Keyguard in Safari. Consider using another Browser.');

        this.code = 'K3';
    }
}