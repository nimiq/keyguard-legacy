export default class TooManyAccountsIOSError extends Error {

    constructor() {
        super('Cannot store more then 10 accounts in Keyguard on this device.');

        this.code = 'K4';
    }
}