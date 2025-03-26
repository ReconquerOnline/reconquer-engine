import { definitions, setAnimation, mineMap, materialToSuccessChanceMap } from "../loader.js";
import { moveAndRotateTowardsTarget } from "../action_utils.js";
import { getMatch, addToFirstInventorySlot, linearInterpolate } from '../utils.js';
import { sendCharacterMessage, sendInfoTargetMessage } from '../message.js';
import { gainXp, getLevel } from "../skills.js";
import ConfigOptions from "../config_options.js";

export default class MineAction {
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

        if (!target || !definitions[target.t] || !mineMap[target.t] || user.lf != target.lf || user.li != target.li) {
            setAnimation(user, 'idle');
            return false;
        }

        var persist = moveAndRotateTowardsTarget(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        var match = getMatch(target, targetPriv.id, mineMap[target.t]);
        if (!match) {
            setAnimation(user, 'idle');
            return false
        }

        if (!userPriv.iw.endsWith('pickaxe')) {
            setAnimation(user, 'idle');
            sendCharacterMessage("I need to be holding a pickaxe.", key, worldState);
            return false;
        }

        setAnimation(user, '2h_crush');
        this.tick += 1;
        if (this.tick == 2) {
            this.tick = 0;
            var definition = definitions[target.t];
            var minimumLevel = definition.level ? definition.level : 100;
            var experience = definition.experience ? definition.experience : 0;
            var level = getLevel('mining', key, worldState);
            if (level < minimumLevel) {
                sendInfoTargetMessage('I need at least level ' + minimumLevel + ' mining to mine this.', 'mining.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }
            if (userPriv.mem == 0 && minimumLevel > ConfigOptions.maxFreeToPlayLevel) {
                sendInfoTargetMessage('I need membership to access content above level ' + ConfigOptions.maxFreeToPlayLevel + '.', 'logo.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }

            var material = userPriv.iw.split('_')[0];
            var success = materialToSuccessChanceMap[material] ? materialToSuccessChanceMap[material] : .5;
            if (Math.random() > linearInterpolate(.25, 1, (level - minimumLevel) / 20)
                || Math.random() > success) {
                return true;
            }
            if (!addToFirstInventorySlot(userPriv, definitions[match], 1)) {
                setAnimation(user, 'idle');
                sendCharacterMessage('My inventory is full.', key, worldState);
                return false;
            }
            gainXp('mining', experience, key, worldState);
        }

        return true;
    }
}