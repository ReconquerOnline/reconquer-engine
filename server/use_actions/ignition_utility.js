import { setAnimation } from "../loader.js";
import { dropItem } from '../action_utils.js';
import { sendCharacterMessage, sendInfoTargetMessage } from "../message.js";
import { checkDynamicCollision, checkStaticCollision } from "../actions/move_action.js";
import { gainXp, getLevel } from "../skills.js";
import { getItemSlot } from "../utils.js";
import ConfigOptions from "../config_options.js";

export default class IgniteAction {
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

        setAnimation(user, 'crouch');
        this.ticks += 1;
        if (this.ticks == 4) {
            setAnimation(user, 'idle');

            var minimumLevel = this.items[0].interaction.level ? this.items[0].interaction.level : 100;
            var experience = this.items[0].interaction.experience ? this.items[0].interaction.experience : 0;
            var level = getLevel('forestry', key, worldState);
            if (level < minimumLevel) {
                sendInfoTargetMessage('I need at least level ' + minimumLevel + ' forestry to light this.', 'forestry.svg', key, worldState);
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
                sendCharacterMessage("I can't make a fire here.", key, worldState);
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

            dropItem('fire', 1, targetLocation, worldState, { sa: 0 }, { despawnTime: 60 + minimumLevel * 2, spawnItem: 'ashes', damage: Math.floor(minimumLevel / 5) + 1, damageTicks: 3 });
            gainXp('forestry', experience, key, worldState);

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