import Account from './accounts/account.js';
import accountStore from './account-store.js';
import state from './state.js';

export default class KeyguardApi {

    static get satoshis() { return 1e5 }

    /*
     triggerAccountImport
     persistAccount
     getAccounts
     sign
     */

    // dummy
    async getAccounts() {
        const accounts = await accountStore.list();
        return accounts.map(account => {
            account
        });
    }

    importAccount() {
        //router.navigate('import');
    }

    exportAccount(accountNumber) {
        state.exportAccount.number = accountNumber;
        state.exportAccount.promise = new Promise((resolve) => {
            state.exportAccount.resolve = resolve;
        });
        //Router.navigate(`export`);
    }

    // dummy
    async sign(sender, recipient, value, fee) {
        const signature = 'mySign';
        return signature;
        // TODO: Either create transaction here, or ACL has to know how to get value out of Transaction.
    }

    async createVolatileAccounts2(number) {

        state.volatileAccounts.clear();

        for (let i = 0; i < number; i++) {
           const { publicKey, privateKey } = await Nimiq.KeyPair.generate();
           const address = await publicKey.toAddress();
           const userFriendlyAddress = address.toUserFriendlyAddress();
           const account = {
               userFriendlyAddress,
               address,
               publicKey,
               privateKey
           };

           state.volatileAccounts.set(userFriendlyAddress, account);
        }

        return [...state.volatileAccounts.keys()];
    }

    async createVolatileAccounts(number) {

        state.volatileAccounts.clear();

        for (let i = 0; i < number; i++) {
            const keyPair = await Nimiq.KeyPair.generate();
            const account = await Account.create(keyPair);
            const userFriendlyAddress = account.address.toUserFriendlyAddress();

            state.volatileAccounts.set(userFriendlyAddress, account);
        }

        return [...state.volatileAccounts.keys()];
    }

    async persistAccount(userFriendlyAddress) {

        const account = state.volatileAccounts.get(userFriendlyAddress);

        if (!account) throw new Error('Account not found');

        if (!await accountStore.put(account)) {
            throw new Error('Account could not be persisted');
        }

        return true;
    }

    // old

    async createTransaction(recipient, value, validityStartHeight, fee = 0) {
        const recipientAddr = Nimiq.Address.fromUserFriendlyAddress(recipient);
        value = Math.round(Number(value) * KeyguardApi.satoshis);
        fee = Math.round(Number(fee) * KeyguardApi.satoshis);
        return Nimiq.wallet.createTransaction(recipientAddr, value, fee, validityStartHeight);
    }

    async importKey(privateKey, persist = true) {
        if(typeof privateKey ===  'string') {
            privateKey = Nimiq.PrivateKey.unserialize(Nimiq.BufferUtils.fromHex(privateKey));
        }
        const keyPair = Nimiq.KeyPair.fromPrivateKey(privateKey);
        Nimiq.wallet = new Nimiq.Wallet(keyPair);
        if (persist) {
            accountStore.put(Nimiq.wallet);
        }
        return this.address;
    }

    async exportKey() {
        return Nimiq.wallet.keyPair.privateKey.toHex();
    }

    async lockWallet(pin) {
        return Nimiq.wallet.lock(pin);
    }

    async unlockWallet(pin) {
        return Nimiq.wallet.unlock(pin);
    }

    async importEncrypted(encryptedKey, password, persist = true) {
        encryptedKey = Nimiq.BufferUtils.fromBase64(encryptedKey);
        Nimiq.wallet = await Nimiq.Wallet.loadEncrypted(encryptedKey, password);
        if (persist) {
            accountStore.put(Nimiq.wallet);
        }
        return this.address;
    }

    async exportEncrypted(password) {
        const exportedWallet = await Nimiq.wallet.exportEncrypted(password);
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