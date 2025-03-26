import { materialToLevelMap, segmentToPVPMultiplier, setAnimation } from "../loader.js";
import { dropItem } from '../action_utils.js';
import { sendCharacterMessage, sendInfoTargetMessage } from "../message.js";
import { checkDynamicCollision, checkStaticCollision } from "../actions/move_action.js";
import { gainXp, getLevel } from "../skills.js";
import { getItemSlot, getTotalQuantityOfItemInInventory, removeAmountFromInventory } from "../utils.js";
import ConfigOptions from "../config_options.js";

export default class NailUtility {
    constructor(target, items) {
        this.target = target;
        this.items = items;
        this.ticks = 0;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];

        if (!this.itemId) {
            this.itemId = userPriv[this.items[0].slot][0];
        }

        var itemSlot = getItemSlot(this.itemId, userPriv);
        if (!itemSlot) {
            setAnimation(user, 'idle');
            return false;
        }

        if (!userPriv.iw.includes('hammer')) {
            sendCharacterMessage('I need to be holding a hammer.', key, worldState);
            return false;
        }
        setAnimation(user, 'hammer');
        this.ticks += 1;
        if (this.ticks == 6) {
            setAnimation(user, 'idle');

            var minimumLevel = this.items[0].interaction.level ? this.items[0].interaction.level : 100;
            var experience = this.items[0].interaction.experience ? this.items[0].interaction.experience : 0;
            var level = getLevel('crafting', key, worldState);
            if (level < minimumLevel) {
                sendInfoTargetMessage('I need at least level ' + minimumLevel + ' crafting to build this.', 'crafting.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }
            if (userPriv.mem == 0 && minimumLevel > ConfigOptions.maxFreeToPlayLevel) {
                sendInfoTargetMessage('I need membership to access content above level ' + ConfigOptions.maxFreeToPlayLevel + '.', 'logo.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }

            var x = user.lr % 4;
            var deltaX = x > .25 && x < 1.75 ? -1 : x > 2.25 && x < 3.75 ? 1 : 0;
            var deltaY = x > 1.25 && x < 2.75 ? 1 : x < .75 || x > 3.25 ? -1 : 0;

            var fromX = user.lsx * 64 + user.lx;
            var fromY = user.lsy * 64 + user.ly;

            var toX = fromX + deltaX;
            var toY = fromY + deltaY;

            if (checkDynamicCollision(toX, toY, user.lf, user.li) || checkStaticCollision(fromX, fromY, toX, toY, user.lf, user.li)) {
                sendCharacterMessage("I can't make a blockade here.", key, worldState);
                return false;
            }

            var targetLocation = {
                lsx: Math.floor(toX / 64),
                lsy: Math.floor(toY / 64),
                lx: toX % 64,
                ly: toY % 64,
                lf: user.lf,
                li: user.li,
                lr: 0
            };

            if (segmentToPVPMultiplier[targetLocation.lsx + '-' + targetLocation.lsy] < 0.05) {
                sendCharacterMessage("I can only create blockades in areas that are 5% PvP damage or higher.", key, worldState);
                return false;
            }

            var nailType = this.target.t;
            var nailQuantity = getTotalQuantityOfItemInInventory(nailType, userPriv);
            if (nailQuantity < 5) {
                sendInfoTargetMessage('I need at least five nails.', [nailType, 5], key, worldState);
                setAnimation(user, 'idle');
                return false;
            }
            removeAmountFromInventory(nailType, 5, userPriv);

            var material = nailType.split('_')[0];
            var hitpoints = (Math.floor(minimumLevel / 5) + 2 + Math.floor(materialToLevelMap[material] / 5)) * 2;

            dropItem(this.items[0].interaction.produces, 1, targetLocation, worldState, {
                mhp: hitpoints,
                hp: hitpoints,
            }, { despawnTime: 15 * 60 }, {
                kac: 1,
                kdc: level,
                ksc: 1,
                karc: 1,
                esld: 0,
                ecrd: 0,
                estd: 0,
                eard: 0,
                barricade: true
            });
            gainXp('crafting', experience, key, worldState);

            if (userPriv[this.items[0].slot][0] == this.itemId) {
                userPriv[this.items[0].slot] = [];
            } else {
                userPriv[itemSlot] = [];
            }
            return false;
        }
        return true;
    }
}