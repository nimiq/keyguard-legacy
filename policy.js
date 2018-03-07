import WalletPolicy from './policies/wallet-policy.js';
import SafePolicy from './policies/safe-policy.js';

export default class Policy {

    static parse(serialized) {
        if (!serialized) return null;
        const policy = Policy.get(serialized.name)
        for (const prop in serialized) policy[prop] = serialized[prop];
        return policy;
    }

    static get(name, ...args) {
        return new Policy.predefined[name](...args);
    }
}

Policy.predefined = {};
for (policy of [WalletPolicy, SafePolicy]) {
    Policy.predefined[policy.name] = policy;
}
