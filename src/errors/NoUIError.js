export default class NoUIError extends Error {

    constructor(method) {
        super(`Method ${method} needs user interface`);

        this.code = 'K2';
    }
}