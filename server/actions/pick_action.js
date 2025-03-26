import { definitions, setAnimation, pickMap } from "../loader.js";
import { moveAndRotateTowardsTarget } from "../action_utils.js";
import { getMatch, addToFirstInventorySlot } from '../utils.js';
import { sendCharacterMessage } from '../message.js';

export default class PickAction {
    constructor(msg) {
        this.target = msg.ta;
        this.tick = 0;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];
        var target = worldState.pub[this.target];
        var targetPriv = worldState.priv[this.target];

        if (!target || !pickMap[target.t] || user.lf != target.lf || user.li != target.li) {
            setAnimation(user, 'idle');
            return false;
        }

        var persist = moveAndRotateTowardsTarget(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        var match = getMatch(target, targetPriv.id, pickMap[target.t]);
        if (!match) {
            setAnimation(user, 'idle');
            sendCharacterMessage('This looks empty.', key, worldState);
            return false
        }

        setAnimation(user, 'pick');
        this.tick += 1;
        if (this.tick == 2) {
            setAnimation(user, 'idle');
            if (addToFirstInventorySlot(userPriv, definitions[match], 1)) {
                target.sf = 0;
                target.sp = 0;
            } else {
                sendCharacterMessage('My inventory is full.', key, worldState);
            }

            return false;
        }

        return true;
    }
}