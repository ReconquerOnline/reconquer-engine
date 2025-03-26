import { sendCharacterMessage } from '../message.js';
import { setAnimation } from '../loader.js';
import { getTotalQuantityOfItemInInventory } from '../utils.js';
import { moveAndRotateTowardsTargetIgnoreFinalWallCollision, transportToPoint } from '../action_utils.js';
import { getItemSlot, removeAmountFromSlot } from "../utils.js";
import { gainXp, getLevel } from '../skills.js';


export class CanoeBuildAction {
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

        if (!target || user.lf != target.lf || user.li != target.li || target.cid != 'dock_canoe') {
            return false;
        }

        var persist = moveAndRotateTowardsTargetIgnoreFinalWallCollision(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        if (userPriv.q010 != 0) {
            setAnimation(user, 'idle');
            sendCharacterMessage("It's already built.", key, worldState);
            return false;
        }

        if (getLevel('crafting', key, worldState) < 10) {
            setAnimation(user, 'idle');
            sendCharacterMessage('I need at least level 10 crafting.', key, worldState);
            return false;
        }

        if (!userPriv.iw.includes('hammer')) {
            setAnimation(user, 'idle');
            sendCharacterMessage('I need to be holding a hammer.', key, worldState);
            return false;
        }

        setAnimation(user, 'hammer');
        this.tick += 1;
        if (this.tick == 6) {
            setAnimation(user, 'idle');
            var pineWoodQuantity = getTotalQuantityOfItemInInventory('pine_wood', userPriv);

            var nailsQuantity = 0;
            for (var i = 0; i < 24; i++) {
                if (userPriv['i' + i][0] && userPriv['i' + i][0].includes('nails')) {
                    nailsQuantity += userPriv['i' + i][1];
                }
            }

            if (pineWoodQuantity < 5 || nailsQuantity < 15) {
                sendCharacterMessage('I need five regular logs and fifteen nails.', key, worldState);
                return false;
            }

            nailsQuantity = 15;
            for (var i = 0; i < 24; i++) {
                if (userPriv['i' + i][0] && userPriv['i' + i][0].includes('nails')) {
                    var quantity = userPriv['i' + i][1];
                    if (quantity >= nailsQuantity) {
                        removeAmountFromSlot('i' + i, nailsQuantity, userPriv);
                        break;
                    }
                    nailsQuantity -= quantity;
                    removeAmountFromSlot('i' + i, quantity, userPriv);
                }
            }
            removeAmountFromSlot(getItemSlot('pine_wood', userPriv), 1, userPriv);
            removeAmountFromSlot(getItemSlot('pine_wood', userPriv), 1, userPriv);
            removeAmountFromSlot(getItemSlot('pine_wood', userPriv), 1, userPriv);
            removeAmountFromSlot(getItemSlot('pine_wood', userPriv), 1, userPriv);
            removeAmountFromSlot(getItemSlot('pine_wood', userPriv), 1, userPriv);
            gainXp('crafting', 40, key, worldState);

            userPriv["cid.dock_canoe.ss"] = 1;
            userPriv["cid.dock_canoe.si"] = 1;
            userPriv.q010 = 1;

            return false;
        }

        return true;
    }
}

export class CanoeSailAction {
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

        if (!target || user.lf != target.lf || user.li != target.li && target.cid == 'dock_canoe') {
            return false;
        }

        var persist = moveAndRotateTowardsTargetIgnoreFinalWallCollision(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        if (userPriv.q010 == 0) {
            sendCharacterMessage("I don't know how to do this.", key, worldState);
            return false;
        }

        if (targetPriv.id == 'dock_canoe.485-510') {
            transportToPoint(user, {
                lsx: 485,
                lsy: 512,
                lx: 42,
                ly: 60,
                lr: 1,
                lf: 0,
                li: 0
            }, worldState); 
        } else {
            transportToPoint(user, {
                lsx: 485,
                lsy: 510,
                lx: 48,
                ly: 28,
                lr: 3,
                lf: 0,
                li: 0
            }, worldState); 
        }

        setAnimation(user, 'idle');
        return false;
    }
}