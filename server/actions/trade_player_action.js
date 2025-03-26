import { definitions, setAnimation } from "../loader.js";
import { moveTowardsTargetWithNonBlockingRotation } from "../action_utils.js";
import { addToFirstInventorySlot, distanceBetween, getItemSlot } from "../utils.js";
import { getAction, removeAction } from "../world_state.js";
import { sendCharacterMessage, sendNPCMessage } from "../message.js";

export default class TradePlayerAction {
    constructor(msg) {
        this.target = msg.ta;
        this.interaction = msg.i;
        this.reset = this.interaction != 'Accept' && this.interaction != 'Finalize';
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    resetTradeInventory(user) {
        for (var i = 0; i < 8; i++) {
            user['ti' + i] = [];
        }
    }
    removeItems(priv, pub) {
        for (var i = 0; i < 8; i++) {
            var slot = 'ti' + i;
            var item = pub[slot];
            if (!item[0]) continue;
            var inventorySlot = getItemSlot(item[0], priv);
            if (!inventorySlot) return false;
            if (priv[inventorySlot][1] - item[1] < 0) return false;
            priv[inventorySlot][1] = priv[inventorySlot][1] - item[1];
            if (priv[inventorySlot][1] == 0) priv[inventorySlot] = [];
        }
        return true;
    }
    addItems(priv, pub) {
        for (var i = 0; i < 8; i++) {
            var slot = 'ti' + i;
            var item = pub[slot];
            if (!item[0]) continue;
            if (!addToFirstInventorySlot(priv, definitions[item[0]], item[1])) {
                return false;
            }
        }
        return true;
    }
    copyInventory(fromInventory, toInventory) {
        for (var i = 0; i < 24; i++) {
            var slot = 'i' + i;
            toInventory[slot] = fromInventory[slot];
        }
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];
        var target = worldState.pub[this.target];

        if (!target || user.lf != target.lf || user.li != target.li) {
            setAnimation(user, 'idle');
            userPriv.msp = 0;
            return false;
        }

        var oldPoint = {
            lsx: user.lsx,
            lsy: user.lsy,
            lx: user.lx,
            ly: user.ly,
            lr: user.lr
        }
        moveTowardsTargetWithNonBlockingRotation(user, target, key, worldState);
        if (distanceBetween(oldPoint, user) == 0) {
            oldPoint.lr != user.lr ? setAnimation(user, 'turn') : setAnimation(user, 'idle');
        }

        // check if other player is trying to trade you
        var targetAction = getAction(target.i);
        if (!targetAction ||
            !(targetAction instanceof TradePlayerAction) ||
            targetAction.target != user.i) {
            userPriv.msp = 0;
            this.reset = true;
            return true
        }
        if (this.reset) {
            user.mps = 0;
            userPriv.msp += 1;
            this.resetTradeInventory(user);
            this.reset = false;
        }
        userPriv.mpt = target.i;
        if (this.interaction == 'Accept') {
            user.mps = 1;
            this.interaction = 'Trade';
        } else if (this.interaction == 'Finalize') {
            user.mps = 2;
            this.interaction = 'Trade';
        }
        if (user.mps == 2 && target.mps == 2) {
            var targetPriv = worldState.priv[this.target];
            userPriv.msp = 0;
            targetPriv.msp = 0;
            user.mps = 0;
            target.mps = 0;
            removeAction(target.i);

            var tempUser = structuredClone(userPriv);
            var tempTarget = structuredClone(targetPriv);

            // remove all offered items from each's temp inventory
            var removedA = this.removeItems(tempUser, user);
            var removedB = this.removeItems(tempTarget, target);

            if (!removedA || !removedB) {
                sendCharacterMessage("That didn't work.", key, worldState);
                return false;
            }

            var userHasSpace = this.addItems(tempUser, target);
            var targetHasSpace = this.addItems(tempTarget, user);

            this.resetTradeInventory(user);
            this.resetTradeInventory(target);

            if (userHasSpace && targetHasSpace) {
                this.copyInventory(tempUser, userPriv);
                this.copyInventory(tempTarget, targetPriv);
                sendNPCMessage('Thank you.', target, key, worldState)
                sendNPCMessage('Thank you.', user, target.i, worldState)
            } else {
                if (!userHasSpace) {
                    sendCharacterMessage("I don't have space.", key, worldState);
                    sendNPCMessage("I don't have space.", user, target.i, worldState);
                } else {
                    sendCharacterMessage("I don't have space.", target.i, worldState);
                    sendNPCMessage("I don't have space.", target, key, worldState);
                }
            }
            return false;
        }
        return true;
    }
}