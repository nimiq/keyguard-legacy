import BasePolicy from './base-policy.js';

export default class FaucetPolicy extends BasePolicy {
    allows(method, args, state) {
        switch (method) {
            case 'list':
            case 'createWallet':
                return true;
            default:
                throw new Error(`Unhandled method: ${method}`);
        }
    }

    needsUi(method, args, state) {
        switch (method) {
            case 'list':
                return false;
            case 'createWallet':
                return true;
            default:
                throw new Error(`Unhandled method: ${method}`);
        }
    }
}
