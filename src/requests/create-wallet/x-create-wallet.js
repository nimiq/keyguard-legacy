import XElement from '/libraries/x-element/x-element.js';
import XRouter from '/secure-elements/x-router/x-router.js';
import XSetPin from './x-set-pin.js';
import XIdenticons from '../../common-elements/x-identicons/x-identicons.js';
import MixinRedux from '/secure-elements/mixin-redux/mixin-redux.js';
import { RequestTypes, setData } from '../request-redux.js';
import { createWalletPersistent } from './actions.js';

export default class XCreateWallet extends MixinRedux(XElement) {

    html() { return `
          <x-identicons x-route=""></x-identicons>
          <x-set-pin x-route="set-pin"></x-set-pin>
          <section x-route="download">
            <x-download-file></x-download-file>
          </section>
        `;
    }

    children() {
        return [
            XSetPin,
            XIdenticons,
        ];
    }

    static mapStateToProps(state) {
        if (state.request.requestType !== RequestTypes.CREATE_WALLET) return;

        const { address } = state.request.data;

        return {
            volatileKey: address && state.keys.volatileKeys.get(address)
        }
    }

    static get actions() {
        return { setData, createWalletPersistent };
    }

    async onCreate() {
        super.onCreate();
        this._router = await XRouter.instance;
    }

    listeners() {
        return {
            'x-choose-identicon': this._onChooseIdenticon.bind(this),
            'x-set-pin': this._onSetPin.bind(this)
        }
    }

    _onChooseIdenticon(address) {
        this.actions.setData(RequestTypes.CREATE_WALLET, { address } );
        this._router.goTo(this, 'set-pin');
    }

    async _onSetPin(pin) {
        this.actions.setData(RequestTypes.CREATE_WALLET, { pin });
        this.actions.createWalletPersistent();
    }
}
