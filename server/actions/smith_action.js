import { dropItem, moveAndRotateTowardsTarget } from "../action_utils.js";
import ConfigOptions from "../config_options.js";
import { definitions, materialToLevelMap, materialToXPMap, setAnimation } from "../loader.js";
import { sendInfoTargetMessage, sendCharacterMessage } from "../message.js";
import { gainXp, getLevel } from "../skills.js";
import { addToFirstInventorySlot } from "../utils.js";

var targetToCost = {
    'nails': 1,
    'arrowheads': 1,
    'bolts': 2,
    'hammer_head': 2,
    'spear_head': 2,
    'knife': 3,
    'hatchet_head': 3,
    'pickaxe_head': 4,
    'scythe_head': 4,
    'mace_head': 6,
    'sword': 8,
    'saber': 8,
    'med_helmet': 8,
    'full_helmet': 8,
    'plate_legs': 12,
    'chain_body': 12,
    'square_shield': 16,
    'round_shield': 16,
    'kite_shield': 16,
    'plate_body': 16,
};

var targetToQuantity = {
    'nails': 5,
    'arrowheads': 5,
    'bolts': 5
};

var sizeToIngot = {
    1: '_ingot_small',
    2: '_ingot_medium',
    3: '_ingot_large',
    4: '_ingot_huge',
};

export default class SmithAction {
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

        userPriv.msis = 0;

        if (!userPriv.msit) {
            setAnimation(user, 'idle');
            return false;
        }

        var targetUUID = userPriv.msit.split(',')[0];
        var target = worldState.pub[targetUUID];

        if (!target ||
            user.lf != target.lf ||
            user.li != target.li ||
            !definitions[target.t] ||
            !definitions[target.t].useTargetInteractions.includes('anvil_utility')) {
            setAnimation(user, 'idle');
            return false;
        }

        var persist = moveAndRotateTowardsTarget(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        var material = userPriv.msit.split(',')[1].split('_')[0];
        var itemToMakeId = material + '_' + this.target;
        var itemToMake = definitions[itemToMakeId];
        if (!itemToMake) {
            setAnimation(user, 'idle');
            return false;
        }

        if (!userPriv.iw.includes('hammer')) {
            sendCharacterMessage('I need to be holding a hammer.', key, worldState);
            return false;
        }

        setAnimation(user, 'hammer');
        this.tick += 1;
        if (this.tick == 6) {

            var minimumLevel = materialToLevelMap[material] ? materialToLevelMap[material] : 100;
            var level = getLevel('smithing', key, worldState);
            if (level < minimumLevel) {
                sendInfoTargetMessage('I need at least level ' + minimumLevel + ' smithing to make this.', 'smithing.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }
            if (userPriv.mem == 0 && minimumLevel > ConfigOptions.maxFreeToPlayLevel) {
                sendInfoTargetMessage('I need membership to access content above level ' + ConfigOptions.maxFreeToPlayLevel + '.', 'logo.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }

            var quantityOfMaterial = 0;
            for (var i = 0; i < 24; i++) {
                quantityOfMaterial += userPriv['i' + i][0] == material + '_ingot_huge' ? 4 : 0;
                quantityOfMaterial += userPriv['i' + i][0] == material + '_ingot_large' ? 3 : 0;
                quantityOfMaterial += userPriv['i' + i][0] == material + '_ingot_medium' ? 2 : 0;
                quantityOfMaterial += userPriv['i' + i][0] == material + '_ingot_small' ? 1 : 0;
            }
            var quantityToMake = targetToCost[this.target];
            if (!quantityToMake) {
                setAnimation(user, 'idle');
                return false;
            }
            if (quantityOfMaterial >= quantityToMake) {
                var quantity = targetToQuantity[this.target] ? targetToQuantity[this.target] : 1;
                // remove ingots
                var quantityLeft = quantityToMake;
                for (var i = 0; i < 24; i++) {
                    if (quantityLeft <= 0) { break; }
                    for (var size in sizeToIngot) {
                        var size = Number(size);
                        var ingot = sizeToIngot[size];
                        if (userPriv['i' + i][0] == material + ingot) {
                            quantityLeft -= size;
                            if (quantityLeft >= 0) {
                                userPriv['i' + i] = [];
                            } else {
                                userPriv['i' + i] = [material + sizeToIngot[Math.abs(quantityLeft)], 1];
                            };
                        }
                    }
                }
                var materialXp = materialToXPMap[material] ? materialToXPMap[material] : 0;
                gainXp('smithing', quantityToMake * materialXp, key, worldState);
                if (!addToFirstInventorySlot(userPriv, definitions[itemToMakeId], quantity)) {
                    dropItem(itemToMakeId, quantity, {
                        lsx: user.lsx,
                        lsy: user.lsy,
                        lx: user.lx,
                        ly: user.ly,
                        lf: user.lf,
                        li: user.li,
                        lr: 0,
                    }, worldState);
                }
            } else {
                setAnimation(user, 'idle');
                return false;
            }

            setAnimation(user, 'idle');
            // if stackable, continue to build items
            if (itemToMake.stackable && quantityOfMaterial - quantityToMake * 2 >= 0) {
                this.tick = 0;
                return true;
            }
            return false;
        }
        return true;

    }
}