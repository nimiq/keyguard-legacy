import BasePolicy from './base-policy.js';

export default class PromoPolicy extends BasePolicy {
    allows(method, args, state) {
        switch (method) {
            case 'importFromFile':
            case 'importFromWords':
            case 'list':
            case 'createWallet':
            case 'signSafe':
            case 'signWallet':
                return true;
            default:
                return false;
        }
    }

    needsUi(method, args, state) {
        switch (method) {
            case 'createWallet':
            case 'importFromFile':
            case 'importFromWords':
            case 'signSafe':
            case 'signWallet':
                return true;
            case 'list':
            default:
                return false;
        }
    }
}
