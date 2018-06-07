import BasePolicy from './base-policy.js';

export default class ShopPolicy extends BasePolicy {
    allows(method, args, state) {
        switch (method) {
            case 'list':
            case 'signSafe':
            case 'signWallet':
                return true;
            default:
                return false;
        }
    }

    needsUi(method, args, state) {
        switch (method) {
            case 'list':
                return false;
            case 'signSafe':
            case 'signWallet':
                return true;
            default:
                return false;
        }
    }
}
