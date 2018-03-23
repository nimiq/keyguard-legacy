import XElement from '/libraries/x-element/x-element.js';
import XRouter from '/elements/x-router/x-router.js';
import XLoader from '/elements/x-loader/x-loader.js';
import XCreate from './requests/create/x-create.js';
import XImportWords from './requests/import-words/x-import-words.js';
import XImportFile from './requests/import-file/x-import-file.js';
import XSign from './requests/sign/x-sign.js';
import XExportFile from './requests/export-file/x-export-file.js';
import XExportWords from './requests/export-words/x-export-words.js';
import XRename from './requests/rename/x-rename.js';
import XClose from '/elements/x-close/x-close.js';
import MixinRedux from '/elements/mixin-redux/mixin-redux.js';

export default class XKeyguard extends MixinRedux(XElement) {

    html() {
        return `
        <x-loader></x-loader>
        <x-router>
          <x-create></x-create> 
          <x-export-words></x-export-words>
          <x-export-file></x-export-file>
          <x-import-file></x-import-file>
          <x-import-words></x-import-words>
          <x-sign x-route="sign"></x-sign>
          <x-rename x-route="rename"></x-rename>
          <x-close x-route="close"></x-close>
          <x-close x-route="/"></x-close>
        </x-router>
        `;
    }

    children() {
        return [ XLoader, XRouter, XClose, XCreate, XImportWords, XRename,  XImportFile, XSign, XExportWords, XExportFile ];
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

// TODO what to do when the user reloads the page and the state is not initialized again?? > persist the state on unload
// that means we would have to put rpc requests in store and open new promises for unresponsed requests