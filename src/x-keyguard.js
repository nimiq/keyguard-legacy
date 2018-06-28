import XElement from '/libraries/x-element/x-element.js';
import XLoader from '/secure-elements/x-loader/x-loader.js';
import XCreateSafe from './requests/create-safe/x-create-safe.js';
import XCreateWallet from './requests/create-wallet/x-create-wallet.js';
import XImportWords from './requests/import-words/x-import-words.js';
import XImportFile from './requests/import-file/x-import-file.js';
import XSignSafe from './requests/sign-safe/x-sign-safe.js';
import XSignWallet from './requests/sign-wallet/x-sign-wallet.js';
import XSignVesting from './requests/sign-vesting/x-sign-vesting.js';
import XBackupFile from './requests/backup-file/x-backup-file.js';
import XBackupWords from './requests/backup-words/x-backup-words.js';
import XRename from './requests/rename/x-rename.js';
import XUpgrade from './requests/upgrade/x-upgrade.js';
import XClose from '/secure-elements/x-close/x-close.js';
import MixinRedux from '/secure-elements/mixin-redux/mixin-redux.js';
import { RequestTypes }  from './requests/request-redux.js';

function getRequestElement(requestType) {
    switch (requestType) {
        case RequestTypes.IMPORT_FROM_WORDS:
            return XImportWords;

        case RequestTypes.IMPORT_FROM_FILE:
            return XImportFile;

        case RequestTypes.CREATE_SAFE:
            return XCreateSafe;

        case RequestTypes.CREATE_WALLET:
            return XCreateWallet;

        case RequestTypes.SIGN_SAFE_TRANSACTION:
            return XSignSafe;

        case RequestTypes.SIGN_WALLET_TRANSACTION:
            return XSignWallet;

        case RequestTypes.SIGN_VESTING_TRANSACTION:
            return XSignVesting;

        case RequestTypes.BACKUP_WORDS:
            return XBackupWords;

        case RequestTypes.BACKUP_FILE:
            return XBackupFile;

        case RequestTypes.RENAME:
            return XRename;

        case RequestTypes.UPGRADE:
            return XUpgrade;

        default:
            throw new Error('unknown request');
    }
}

export default (requestType) => {
    const RequestElement = getRequestElement(requestType);

    const tagName = XElement.__toTagName(RequestElement.name);

    return class XKeyguard extends MixinRedux(XElement) {

        html() {
            return `
        <x-loader></x-loader>
        <div class="x-route-container">
            <${ tagName } x-route="${requestType}"></${ tagName }>
            <x-close x-route="close"></x-close>
            <div><x-close x-route="/"></x-close></div>
        </div>
        <a secondary x-href="close">
            <i class="material-icons">&#xE5C9;</i>
            Cancel
        </a>
        `;
        }

        children() {
            return [ XLoader, XClose, RequestElement ];
        }

        static mapStateToProps(state) {
            return {
                executing: state.request.executing
            };
        }

        _onPropertiesChanged(changes) {
            if (changes.executing !== undefined) {
                this.$loader.loading = changes.executing;
            }
        }
    }
}

// TODO what to do when the user reloads the page and the state is not initialized again?? > persist the state on unload
// that means we would have to put rpc requests in store and open new promises for unresponsed requests
