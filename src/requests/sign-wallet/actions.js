import { SATOSHIS, RequestTypes, setExecuting, setResult, setData } from '../request-redux.js';
import { keyStore } from '../../keys/index.js';
import Utf8Tools from '/libraries/secure-utils/utf8-tools/utf8-tools.js';

// called after confirming a transaction sign request (BASIC transaction)
export function signWalletTransaction(pin ) {
    return async (dispatch, getState) => {
        dispatch( setExecuting(RequestTypes.SIGN_WALLET_TRANSACTION) );

        const { transaction: { recipient, value, fee, validityStartHeight, extraData }, address } = getState().request.data;

        try {
            const key = await keyStore.get(address, pin);
            const tx = await key.createTransaction(recipient, value, fee, validityStartHeight, extraData, extraData && extraData.length > 0 ? 'extended' : 'basic');

            const signatureProof = Nimiq.SignatureProof.unserialize(new Nimiq.SerialBuffer(tx.proof));

            dispatch(
                setResult(RequestTypes.SIGN_WALLET_TRANSACTION, {
                    sender: tx.sender.toUserFriendlyAddress(),
                    senderPubKey: signatureProof.publicKey.serialize(),
                    recipient: tx.recipient.toUserFriendlyAddress(),
                    value: tx.value / SATOSHIS,
                    fee: tx.fee / SATOSHIS,
                    validityStartHeight: tx.validityStartHeight,
                    signature: signatureProof.signature.serialize(),
                    extraData: tx.data,
                    hash: tx.hash().toBase64()
                })
            )
        } catch (e) {
            // assume the password was wrong
            console.error(e);
            dispatch(
                setData(RequestTypes.SIGN_WALLET_TRANSACTION, { isWrongPin: true })
            );
        }
    }
}
