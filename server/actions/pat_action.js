import * as WorldState from '../world_state.js';
import { sendNPCMessage } from '../message.js';
import { setAnimation } from '../loader.js';
import FollowAction from '../actions/follow_action.js';
import { moveAndRotateTowardsTarget } from '../action_utils.js';
import { getTotalQuantityOfItemInInventory } from '../utils.js';
import SellAction from './sell_action.js';

// Pat Action
export default class PatAction {
    constructor(msg) {
        this.target = msg.ta;
        this.tick = 0;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {

        var user = worldState.pub[key];

        var target = worldState.pub[this.target];
        var targetPriv = worldState.priv[this.target];
        if (!target || !targetPriv.id.startsWith('packmule') || user.lf != target.lf || user.li != target.li) {
            setAnimation(user, 'idle');
            return false;
        }

        var persist = moveAndRotateTowardsTarget(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };


        if (this.tick == 0) {
            this.tick += 1;
            setAnimation(user, 'pick');
            return true;
        } else if (this.tick == 1) {
            var currentAction = WorldState.getAction(target.i);
            if (currentAction && currentAction.target == user.i) {
                sendNPCMessage('Haw Hee Haw...', target, key, worldState);
                WorldState.removeAction(target.i);
            } else {
                sendNPCMessage('Haw haw haw...', target, key, worldState);
                WorldState.addAction(
                    target.i,
                    new FollowAction({
                        ta: key
                    })
                );
            }
            setAnimation(user, 'idle');
        }

    }
}

export function PackmuleUseHandler(slots, key, worldState, target) {
    var userPriv = worldState.priv[key];

    var oldMst = userPriv.mst;
    userPriv.mst = target.i;
    new SellAction({
        ta: slots[0],
        i: 'Deposit All'
    }).handleTick(key, worldState);
    userPriv.mst = oldMst;
    return;
}