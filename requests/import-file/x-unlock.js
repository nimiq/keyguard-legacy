import XElement from '/libraries/x-element/x-element.js';
import XAuthenticate from '/libraries/keyguard/common-elements/x-authenticate.js';
import XRouter from '/elements/x-router/x-router.js';
import MixinRedux from '/elements/mixin-redux/mixin-redux.js';
import { RequestTypes, setData } from '../request-redux.js';

export default class XUnlock extends MixinRedux(XElement) {

    html() { return `
        <h1>Enter your Passphrase</h1>
        <section>
            <p>Please enter your passphrase to unlock your Account Access File.</p>
        </section>
        <x-authenticate button-label="Import"></x-authenticate>
        `;
    }

    children() {
        return [ XAuthenticate ];
    }

    listeners() {
        return {
            'x-authenticate-submitted': this._onSubmit.bind(this)
        };
    }

    static get actions() {
        return { setData };
    }

    _onSubmit(passphrase) {
        this.actions.setData(RequestTypes.IMPORT_FROM_FILE, { passphrase });
        XRouter.root.goTo('import-from-file/set-label');
    }
}
