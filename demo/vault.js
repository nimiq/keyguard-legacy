import { RPC, EventClient } from '/libraries/boruca-messaging/src/boruca.js';
import Policy from '../policy.js';
import config from './config.js';

class Vault {
    constructor() {
        this.$network = document.querySelector('#network');
        this.$keystore = document.querySelector('#keystore');
        this.launch();
    }

    async launch() {
        this._keystore = await RPC.Client(this.$keystore.contentWindow, 'KeystoreApi');

        const assumedPolicy = new Policy('vaultDefault');

        let authorized = false;

        const policy = Policy.parse(await this._keystore.getPolicy());
        console.log(`Got policy: ${policy}`);

        if (!policy.equals(assumedPolicy)) {
            if (await this._keystore.authorize(assumedPolicy)) {
                authorized = true;
                console.log('Authorization successfull');
            } else {
                console.log('Authorization declined');
            }
        } else {
            authorized = true;
        }

        if (!authorized){
            return;
        }

        console.log('Now we are authorized');

        const addresses = await this._keystore.getAddresses();

        console.log(`Addresses: ${addresses}`);

    }
}

window.vault = new Vault();