import BasePolicy from './base-policy.js';
import * as AccountType from '../keys/keytype.js';

export default class SafePolicy extends BasePolicy {
    allows(method, args, state) {
        switch (method) {
            case 'triggerImport':
            case 'get':
            case 'createVolatile':
            case 'persist':
                return true;
            case 'sign':
                const { accountNumber, recipient, value, fee } = args;
                const account = state.accounts.get(accountNumber);
                if (account.type === AccountType.High) return true;
                break;
            default:
                throw new Error(`Unhandled method: ${method}`);
        }
    }

    needsUi(method, args, state) {
        switch (method) {
            case 'get':
            case 'createVolatile':
                return false;
            case 'persist':
            case 'triggerImport':
            case 'sign':
                return true;
            default:
                throw new Error(`Unhandled method: ${method}`);
        }
    }
}
