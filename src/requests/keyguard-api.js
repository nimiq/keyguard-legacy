import { bindActionCreators } from '/libraries/redux/src/index.js';
import ValidationUtils from '/libraries/secure-utils/validation-utils/validation-utils.js';
import { KeyType, keyStore } from '../keys/index.js';
import store from '../store.js';
import { createVolatile, clearVolatile } from '../keys/keys-redux.js';
import { start, loadAccountData } from './request-redux.js';
import XRouter from '/secure-elements/x-router/x-router.js';
import { RequestTypes } from './request-redux.js';
import BrowserDetection from '/libraries/secure-utils/browser-detection/browser-detection.js';
import { TooManyAccountsIOSError, TooManyAccountsSafariError } from '/libraries/keyguard/src/errors/index.js';

export default class KeyguardApi {

    constructor() {
        this.actions = bindActionCreators({
            createVolatile,
            clearVolatile,
            start,
            loadAccountData
        }, store.dispatch);
    }

    /** WITHOUT UI */

    async list() {
        if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
            return this._listFromCookie();
        }

        const keys = await keyStore.list();
        return keys;
    }

    async _listFromCookie() {
        const match = document.cookie.match(new RegExp('accounts=([^;]+)'));

        if (match) {
            const decoded = decodeURIComponent(match[1]);
            return JSON.parse(decoded);
        }

        return [];
    }

    async getMinerAccount() {
        const keys = await this.list();

        const firstMinerKey = keys.find(key => key.label === 'Miner Account');
        if (firstMinerKey) return firstMinerKey;

        // Return first Safe key or NULL
        return keys.find(key => key.type === KeyType.HIGH) || null;
    }

    /*createVolatile(number) {

        this.actions.clearVolatile();

        this.actions.createVolatile(number);

        const keys = store.getState().keys.volatileKeys;

        return [...keys.keys()]; // = addresses
    }

    async persistWithPin(userFriendlyAddress, pin) {

        const key = store.getState().keys.volatileKeys.get(userFriendlyAddress);

        if (!key) throw new Error('Key not found');

        key._type = KeyType.low;

        if (!await keyStore.put(key, pin)) {
            throw new Error('Key could not be persisted');
        }

        return true;
    }*/

    /*async lock(userFriendlyAddress, pin) {
        const key = keyStore.get(userFriendlyAddress);
        return key.lock(pin);
    }

    async unlock(userFriendlyAddress, pin) {
        const key = keyStore.get(userFriendlyAddress);
        return key.unlock(pin);
    }*/

    /** WITH UI */

    /** Set request state to started and wait for UI to set the result
     *
     * @param { RequestType} requestType
     * @param { Object } data - additional request data
     * @return {Promise<any>} - answer for calling app
     * @private
     */
    _startRequest(requestType, data = {}) {
        return new Promise((resolve, reject) => {

            // only one request at a time
            if (store.getState().request.requestType) {
                throw new Error('Request already started');
            }

            // Set request state to started. Save reject so we can cancel the request when the window is closed
            this.actions.start(requestType, reject, data);

            // open corresponding UI
            XRouter.create(requestType);

            // load account data, if we already know the account this request is about
            if (data.address) {
                this.actions.loadAccountData(requestType);
            }

            // wait until the ui dispatches the user's feedback
            store.subscribe(async () => {
                const request = store.getState().request;

                if (request.error) {
                    reject(request.error);
                    self.close();
                }

                if (request.result) {
                    if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
                        // Save result in cookie, so lovely Safari can find them without IndexedDB access
                        const keys = (await keyStore.list()).slice(0, 10);
                        const keysWithLabelsEncoded = keys.map(x => Object.assign({}, x, {
                            label: encodeURIComponent(x.label)
                        }));

                        const encodedKeys = JSON.stringify(keysWithLabelsEncoded);

                        const expireDate = new Date('23 Jun 2038 00:00:00 PDT');
                        document.cookie = `accounts=${encodedKeys }; expires=${ expireDate.toUTCString() }`;
                    }

                    resolve(request.result);
                }
            });
        });
    }

    /** Checks if there are already 10 keys and we are in Safari / iOS where keys are stored in cookie. In that case
     * there is no space for another key.
     *
     * @return {Promise<any>}
     * @private
     */
    async _preventSafariKeyOverflow(guardedAction) {
        if (BrowserDetection.isIOS() || BrowserDetection.isSafari()) {
            const keys = await keyStore.list();
            if (keys.length >= 10) {
                self.close();
                if (BrowserDetection.isIOS()) {
                    throw new TooManyAccountsIOSError();
                } else if (BrowserDetection.isSafari()) {
                    throw new TooManyAccountsSafariError();
                }
            }
        }

        return guardedAction();
    }

    async createSafe() {
        return await this._preventSafariKeyOverflow(() => this._startRequest(RequestTypes.CREATE_SAFE));
    }

    async createWallet(label = 'Miner Account') {
        return await this._preventSafariKeyOverflow(() => this._startRequest(RequestTypes.CREATE_WALLET, {
            label
        }));
    }

    // todo later: test if transaction or generic message and react accordingly
    /*async sign(message) {
        const {sender, recipient, value, fee} = message;
        const signature = 'mySign';
        return signature;
    }*/

    async signSafe(transaction) {
        if (transaction.value < 1/Nimiq.Policy.SATOSHIS_PER_COIN) {
            throw new Error('Amount is too small');
        }
        if (transaction.network !== Nimiq.GenesisConfig.NETWORK_NAME) throw Error(`Network missmatch: ${transaction.network} in transaction, but ${Nimiq.GenesisConfig.NETWORK_NAME} in Keyguard`);

        const key = await keyStore.getPlain(transaction.sender);
        if (key.type !== KeyType.HIGH) throw new Error('Unauthorized: sender is not a Safe account');

        transaction.value = Nimiq.Policy.coinsToSatoshis(transaction.value);
        transaction.fee = Nimiq.Policy.coinsToSatoshis(transaction.fee);

        return this._startRequest(RequestTypes.SIGN_SAFE_TRANSACTION, {
            transaction,
            address: transaction.sender // for basic transactions, todo generalize
        });
    }

    async signWallet(transaction) {
        if (transaction.value < 1/Nimiq.Policy.SATOSHIS_PER_COIN) {
            throw new Error('Amount is too small');
        }
        if (transaction.network !== Nimiq.GenesisConfig.NETWORK_NAME) throw Error(`Network missmatch: ${transaction.network} in transaction, ${Nimiq.GenesisConfig.NETWORK_NAME} in Keyguard`);

        const key = await keyStore.getPlain(transaction.sender);
        if (key.type !== KeyType.LOW) throw new Error('Unauthorized: sender is not a Wallet account');

        transaction.value = Nimiq.Policy.coinsToSatoshis(transaction.value);
        transaction.fee = Nimiq.Policy.coinsToSatoshis(transaction.fee);

        return this._startRequest(RequestTypes.SIGN_WALLET_TRANSACTION, {
            transaction,
            address: transaction.sender // for basic transactions, todo generalize
        });
    }

    async signVesting(transaction) {
        if (transaction.value < 1/Nimiq.Policy.SATOSHIS_PER_COIN) {
            throw new Error('Amount is too small');
        }
        if (transaction.network !== Nimiq.GenesisConfig.NETWORK_NAME) throw Error(`Network missmatch: ${transaction.network} in transaction, ${Nimiq.GenesisConfig.NETWORK_NAME} in Keyguard`);

        const key = await keyStore.getPlain(transaction.recipient);
        if (key.type !== KeyType.HIGH) throw new Error('Unauthorized: recipient is not a Safe account');

        transaction.value = Nimiq.Policy.coinsToSatoshis(transaction.value);
        transaction.fee = Nimiq.Policy.coinsToSatoshis(transaction.fee);

        return this._startRequest(RequestTypes.SIGN_VESTING_TRANSACTION, {
            transaction,
            address: transaction.recipient
        });
    }

    async importFromFile() {
        return await this._preventSafariKeyOverflow(() => this._startRequest(RequestTypes.IMPORT_FROM_FILE));
    }

    async importFromWords() {
        return await this._preventSafariKeyOverflow(() => this._startRequest(RequestTypes.IMPORT_FROM_WORDS));
    }

    async backupFile(address) {
        if (!ValidationUtils.isValidAddress(address)) return;

        const key = await keyStore.getPlain(address);
        if (key.type !== KeyType.LOW) throw new Error('Unauthorized: address is not a Wallet account');

        return this._startRequest(RequestTypes.BACKUP_FILE, {
            address
        });
    }

    async backupWords(address) {
        if (!ValidationUtils.isValidAddress(address)) return;

        const key = await keyStore.getPlain(address);
        if (key.type !== KeyType.HIGH) throw new Error('Unauthorized: address is not a Safe account');

        return this._startRequest(RequestTypes.BACKUP_WORDS, {
            address
        });
    }

    rename(address) {
        if (!ValidationUtils.isValidAddress(address)) return;

        return this._startRequest(RequestTypes.RENAME, {
            address
        });
    }

    async upgrade(address) {
         if (!ValidationUtils.isValidAddress(address)) return;

        const key = await keyStore.getPlain(address);
        if (key.type !== KeyType.LOW) throw new Error('Unauthorized: Address is not a Wallet account');
        if (key.label !== 'Miner Account') throw new Error('Unauthorized: Only Miner accounts can be upgraded');

        return this._startRequest(RequestTypes.UPGRADE, {
            address
        });
    }
}

KeyguardApi.RPC_WHITELIST = [
    'list',
    'getMinerAccount',
    'createSafe',
    'createWallet',
    'signSafe',
    'signWallet',
    'signVesting',
    'importFromFile',
    'importFromWords',
    'backupFile',
    'backupWords',
    'rename',
    'upgrade'
];
