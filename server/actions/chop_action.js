import { definitions, setAnimation, chopMap, materialToSuccessChanceMap } from "../loader.js";
import { moveAndRotateTowardsTarget } from "../action_utils.js";
import { getMatch, addToFirstInventorySlot, linearInterpolate } from '../utils.js';
import { sendCharacterMessage, sendInfoTargetMessage } from '../message.js';
import { gainXp, getLevel } from "../skills.js";
import ConfigOptions from "../config_options.js";

export default class ChopAction {
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

        if (!target || !definitions[target.t] || !chopMap[target.t] || user.lf != target.lf || user.li != target.li) {
            setAnimation(user, 'idle');
            return false;
        }

        var persist = moveAndRotateTowardsTarget(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        var match = getMatch(target, targetPriv.id, chopMap[target.t]);
        if (!match) {
            setAnimation(user, 'idle');
            return false
        }

        if (!userPriv.iw.endsWith('hatchet')) {
            setAnimation(user, 'idle');
            sendCharacterMessage("I need to be holding a hatchet.", key, worldState);
            return false;
        }
        setAnimation(user, 'slash');
        this.tick += 1;
        if (this.tick == 2) {
            this.tick = 0;
            var definition = definitions[target.t];
            var minimumLevel = definition.level ? definition.level : 100;
            var experience = definition.experience ? definition.experience : 0;
            var fellingChance = definition.fellingChance !== undefined ? definition.fellingChance : 0.5;
            var level = getLevel('forestry', key, worldState);
            if (level < minimumLevel) {
                sendInfoTargetMessage('I need at least level ' + minimumLevel + ' forestry to chop this.', 'forestry.svg', key, worldState);
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
            if (addToFirstInventorySlot(userPriv, definitions[match], 1)) {
                gainXp('forestry', experience, key, worldState);
                // chance of felling
                if (Math.random() < fellingChance) {
                    target.si = 0;
                    target.sm = 0;
                    setAnimation(user, 'idle');
                    return false;
                }
            } else {
                setAnimation(user, 'idle');
                sendCharacterMessage('I can\'t carry anything else.', key, worldState);
                return false;
            }
        }

        return true;
    }
}