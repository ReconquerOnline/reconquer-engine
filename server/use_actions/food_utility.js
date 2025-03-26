import { definitions, setAnimation } from "../loader.js";
import { sendCharacterMessage } from '../message.js';

export default class FoodUtilityAction {
    constructor(target, items, interaction) {
        this.target = target;
        this.items = items;
        this.ticks = 0;
        this.interaction = interaction;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var pub = worldState.pub[key];
        var priv = worldState.priv[key];
        var targetPub = this.target;

        if (!targetPub) {
            setAnimation(pub, 'idle');
            return;
        }

        var itemSlot = this.items[0].slot;
        var itemId = priv[itemSlot][0];
        if (targetPub.i == key || !targetPub.mhp || !itemId || !definitions[itemId] || !definitions[itemId].eatBehavior) {
            sendCharacterMessage('Nothing happens.', key, worldState);
            return;
        };

        var eatBehavior = definitions[itemId].eatBehavior;

        var hpToHeal = 0;
        if (typeof eatBehavior == "number") {
            hpToHeal = eatBehavior
        } else if(eatBehavior.hitpointsToHeal) {
            hpToHeal = eatBehavior.hitpointsToHeal;
        }

        priv[itemSlot] = [];

        if (eatBehavior.produces) {
            priv[itemSlot] = structuredClone(eatBehavior.produces);
        }
        this.target = null;

        setAnimation(pub, 'pick');
    
        targetPub.hp += hpToHeal;
        targetPub.hp = Math.min(targetPub.hp, targetPub.mhp);


        return true;
    }
}