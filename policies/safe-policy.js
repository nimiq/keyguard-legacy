import Policy from './policy.js';
import * as AccountType from '../account-type.js';

export default class SafePolicy extends Policy {
    allows(method, args) {
        switch (method) {
            case 'createNewAccounts':
            case 'triggerAccountImport':
            case 'persistAccount':
            case 'getAddresses':
                return true;
            case 'sign':
                const { account, recipient, value, fee } = args;
                if (account.type === AccountType.High) return true;
                break;
            default:
                throw 'Unhandled method';
        }
    }

    needsUi(method, args) {
        switch (method) {
            case 'createNewAccounts':
            case 'getAddresses':
                return false;
            case 'triggerAccountImport':
            case 'persistAccount':
            case 'sign':
                return true;
            default:
                throw 'Unhandled method';
        }
    }
}