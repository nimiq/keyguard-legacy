import { bindActionCreators } from '/libraries/redux/src/index.js';
import Key from './keys/key.js';
import * as Keytype from './keys/keytype.js';
import keyStore from './keys/keystore.js';
import store from './store/store.js';
import { createVolatile, clearVolatile } from './store/keys.js';
import { start } from './store/request.js';
import XRouter from '/elements/x-router/x-router.js';
import { RequestTypes } from './store/request.js';

export default class KeyguardApi {

    static get satoshis() { return 1e5 }

    constructor() {
        this.actions = bindActionCreators({
            createVolatile,
            clearVolatile,
            start,
        }, store.dispatch);
    }

    /** WITHOUT UI */

    /** SAFE AND WALLET */

    async list() {
        const keys = await keyStore.list();
        return keys;
    }

    /** SAFE */

    /**
     * called by safe after back up file was downloaded
     */
    async activate(userFriendlyAddress) {
        await keyStore.activate(userFriendlyAddress);
    }

    /** WALLET */

    createVolatile(number) {

        this.actions.clearVolatile();

        this.actions.createVolatile(number);

        const keys = store.getState().keys.volatileKeys;

        return [...keys.keys()]; // = addresses
    }

    async persistWithPin(userFriendlyAddress, pin) {

        const key = store.getState().keys.volatileKeys.get(userFriendlyAddress);

        if (!key) throw new Error('Key not found');

        key._type = Keytype.low;

        if (!await keyStore.put(key, pin)) {
            throw new Error('Key could not be persisted');
        }

        return true;
    }

    async lock(userFriendlyAddress, pin) {
        const key = keyStore.get(userFriendlyAddress);
        return key.lock(pin);
    }

    async unlock(userFriendlyAddress, pin) {
        const key = keyStore.get(userFriendlyAddress);
        return key.unlock(pin);
    }

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

            // set request state to started
            this.actions.start(requestType, data);

            // wait until the ui dispatches the user's feedback
            store.subscribe(() => {
                const request = store.getState().request;

                if (request.error) {
                    reject(request.error);
                }

                if (request.result) {
                    resolve(request.result);
                }
            });

            // open corresponding UI
            XRouter.root.goTo(requestType);
        });
    }

    /** SAFE */

    async create() {
        return this._startRequest(RequestTypes.CREATE);
    }

    // todo later: test if transaction or generic message and react accordingly
    /*async sign(message) {
        const {sender, recipient, value, fee} = message;
        const signature = 'mySign';
        return signature;
    }*/

    async sign(transaction) {
        return this._startRequest(RequestTypes.SIGN_TRANSACTION, {
            transaction
        });
    }

    importFromFile(encryptedKey) {
        return this._startRequest(RequestTypes.IMPORT_FROM_FILE, {
            encryptedKey
        });
    }

    importFromWords() {
        return this._startRequest(RequestTypes.IMPORT_FROM_WORDS);
    }

    exportKey(address) {
        return this._startRequest(RequestTypes.EXPORT, {
            address
        });
    }

    rename(address) {
        const request = this._startRequest(RequestTypes.RENAME, {
            address
        });
        // TODO [max] theoretically, we need the label every time we use an address.
        this.actions.loadAccountData(RequestType.RENAME);
        return request;
    }

    // old

    async import(privateKey) {
        if(typeof privateKey ===  'string') {
            privateKey = Nimiq.PrivateKey.unserialize(Nimiq.BufferUtils.fromHex(privateKey));
        }
        const keyPair = Nimiq.KeyPair.fromPrivateKey(privateKey);
        const key = new Key(keyPair);
        await keyStore.put(account);

        return key.userFriendlyAddress;
    }



    async importEncrypted(encryptedKey, password, persist = true) {
        encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKey);
        const account = Key.loadEncrypted(encryptedKey, password);
        if (persist) {
            keyStore.put(account);
        }
        return account.userFriendlyAddress;
    }

    async exportEncrypted(password) {
        const exportedWallet = Key.exportEncrypted(password);
        return Nimiq.BufferUtils.toBase64(exportedWallet);
    }

    /** @param {string} friendlyAddress */
    async getUnfriendlyAddress(friendlyAddress) {
        return Nimiq.Address.fromUserFriendlyAddress(friendlyAddress);
    }

    static validateAddress(address) {
        try {
            this.isUserFriendlyAddress(address);
            return true;
        } catch (e) {
            return false;
        }
    }

    // Copied from: https://github.com/nimiq-network/core/blob/master/src/main/generic/consensus/base/account/Address.js

    static isUserFriendlyAddress(str) {
        str = str.replace(/ /g, '');
        if (str.substr(0, 2).toUpperCase() !== 'NQ') {
            throw new Error('Addresses start with NQ', 201);
        }
        if (str.length !== 36) {
            throw new Error('Addresses are 36 chars (ignoring spaces)', 202);
        }
        if (this._ibanCheck(str.substr(4) + str.substr(0, 4)) !== 1) {
            throw new Error('Address Checksum invalid', 203);
        }
    }

    static _ibanCheck(str) {
        const num = str.split('').map((c) => {
            const code = c.toUpperCase().charCodeAt(0);
            return code >= 48 && code <= 57 ? c : (code - 55).toString();
        }).join('');
        let tmp = '';

        for (let i = 0; i < Math.ceil(num.length / 6); i++) {
            tmp = (parseInt(tmp + num.substr(i * 6, 6)) % 97).toString();
        }

        return parseInt(tmp);
    }
}
