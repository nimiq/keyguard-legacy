export const TypeKeys = {
    SET_PASSWORD: 'userInputs/setPassword',
    SET_LABEL: 'userInputs/setLabel',
    CONFIRM: 'userInputs/confirm',
    CLEAR: 'userInputs/clear'
};

export function reducer(state, action) {
    const initialState = {
        password: undefined,
        label: undefined,
        confirmed: undefined
    };

    if (state === undefined) {
        return initialState;
    }

    switch (action.type) {
        case TypeKeys.SET_PASSWORD:
            return {
                ...state,
                password: action.password
            };

        case TypeKeys.SET_LABEL:
            return {
                ...state,
                label: action.label
            };

        case TypeKeys.CONFIRM:
            return {
                ...state,
                confirmed: action.confirmed
            };

        case TypeKeys.CLEAR:
            return initialState;

        default:
            return state
    }
}

export function setPassword(password) {
    return {
        type: TypeKeys.SET_PASSWORD,
        password
    }
}

export function setLabel(label) {
    return {
        type: TypeKeys.SET_LABEL,
        label
    }
}

export function confirm(confirmed) {
    return {
        type: TypeKeys.CONFIRM,
        confirmed
    }
}

export function clear() {
    return {
        type: TypeKeys.CLEAR
    }

}
