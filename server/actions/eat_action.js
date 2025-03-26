import { validArgs } from '../inventory.js';
import { definitions, setAnimation, skillToFieldMap } from '../loader.js';

export default class EatAction {
    constructor(msg) {
        this.target = msg.ta;
    }
    static validate(msg) {
        return validArgs[msg.ta];
    }
    handleTick(key, worldState) {
        var pub = worldState.pub[key];
        var priv = worldState.priv[key];
        if (!priv[this.target] || priv[this.target][0] === undefined) {
            setAnimation(pub, 'idle');
            return;
        }

        var itemId = priv[this.target][0];
        var eatBehavior = definitions[itemId].eatBehavior;
        if (!eatBehavior) {
            setAnimation(pub, 'idle');
            return;
        }

        var hpToHeal = 0;
        if (typeof eatBehavior == "number") {
            hpToHeal = eatBehavior
        } else {
            if (eatBehavior.hitpointsToHeal) {
                hpToHeal = eatBehavior.hitpointsToHeal;
            }
            if (eatBehavior.boost) {
                // apply each boost
                for (var boost of eatBehavior.boost) {
                    var entry = priv;
                    if (boost.skill == 'health') {
                        entry = pub;
                    }
                    if (boost.skill == 'fidelity') {
                        worldState.serv[key].tp += boost.amount * 100;
                        worldState.serv[key].tp = Math.min(entry[skillToFieldMap[boost.skill][1]] + boost.amount * 100, worldState.serv[key].tp)
                    }
                    entry[skillToFieldMap[boost.skill][2]] += boost.amount;
                    entry[skillToFieldMap[boost.skill][2]] = Math.min(entry[skillToFieldMap[boost.skill][1]] + boost.amount, entry[skillToFieldMap[boost.skill][2]])
                }
            }
        }

        priv[this.target] = [];

        if (eatBehavior.produces) {
            priv[this.target] = structuredClone(eatBehavior.produces);
        }
        this.target = null;

        setAnimation(pub, 'eat');
        if (pub.hp < pub.mhp) {
            pub.hp += hpToHeal;
            pub.hp = Math.min(pub.hp, pub.mhp);
        }

        return true;
    }
}