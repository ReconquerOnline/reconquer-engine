import { definitions, getAnimationName, setAnimation } from "../loader.js";
import { moveWithinOneSquareAndRotateTowardsTargetIgnoreFinalWallCollision } from "../action_utils.js";
import { addToFirstInventorySlot, getTotalQuantityOfItemInInventory, linearInterpolate, removeAmountFromInventory } from '../utils.js';
import { gainXp, getLevel } from "../skills.js";
import { sendCharacterMessage } from '../message.js';
import ConfigOptions from "../config_options.js";

var fishingSpots = {
    'fishing_spot.cave': [{
        id: 'shrimp_meat_raw',
        level: -10,
        experience: 1,
        animation: 'fish'
    }],
    'fishing_spot.pond': [{
        id: 'tilapia_meat_raw',
        level: 25,
        animation: 'sitting',
        consumes: 'worms',
        experience: 6
    },{
        id: 'catfish_meat_raw',
        level: 10,
        animation: 'sitting',
        consumes: 'worms',
        experience: 3
    },{
        id: 'shrimp_meat_raw',
        level: -10,
        experience: 1,
        animation: 'fish'
    }],
    'fishing_spot_salt': [{
        id: 'sardine_meat_raw',
        level: 5,
        animation: 'sitting',
        experience: 2
    },{
        id: 'shrimp_meat_raw',
        level: -10,
        experience: 1,
        animation: 'fish'
    }],
    'fishing_spot_lava': [{
        id: 'eel_meat_raw',
        level: 20,
        animation: 'sitting',
        experience: 5,
        consumes: "electric_worms"
    }],
    'fishing_spot.river': [{
            id: 'trout_meat_raw',
            level: 15,
            experience: 4,
            animation: 'sitting',
            consumes: 'feathers',
    },{
        id: 'shrimp_meat_raw',
        level: -10,
        experience: 1,
        animation: 'fish'
    }]
};

export default class FishAction {
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

        if (!target || user.lf != target.lf || user.li != target.li || !target.t.includes('fishing_spot')) {
            setAnimation(user, 'idle');
            return false;
        }

        var now = Date.now();
        // change every five minutes
        if (!targetPriv.timeStamp || now - targetPriv.timeStamp > 300000) {
            targetPriv.timeStamp = now;
            targetPriv.probability = Math.random() > .5 ? .2 : 1;
        }

        // get within one square of target
        var persist = moveWithinOneSquareAndRotateTowardsTargetIgnoreFinalWallCollision(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        if (userPriv.iw == 'fishing_rod') {
            setAnimation(user, 'sitting');
        } else {
            setAnimation(user, 'fish');
        }

        this.tick += 1;
        if (this.tick == 2) {
            this.tick = 0;
            // chance of failure

            var fishingSpotId = targetPriv.id;
            if (!fishingSpots[fishingSpotId]) return true;

            var fishingLevel = getLevel('fishing', key, worldState);

            var fishAttempts = fishingSpots[fishingSpotId];
            for (var i = 0; i < fishAttempts.length; i++) {
                var attempt = fishAttempts[i];
                if (fishingLevel < attempt.level) continue;

                if (userPriv.mem == 0 && attempt.level > ConfigOptions.maxFreeToPlayLevel) {
                    continue;
                }

                if (attempt.consumes && getTotalQuantityOfItemInInventory(attempt.consumes, userPriv) == 0) continue;
                var animation = getAnimationName(user, user.sa);
                if (animation != attempt.animation) continue;

                if (Math.random() > linearInterpolate(0.2, 1, (fishingLevel - attempt.level) / 20) * targetPriv.probability) {
                    continue;
                }
                var experience = attempt.experience;
                if (addToFirstInventorySlot(userPriv, definitions[attempt.id], 1)) {
                    if (attempt.consumes) { removeAmountFromInventory(attempt.consumes, 1, userPriv); }
                    gainXp('fishing', experience, key, worldState);
                } else {
                    setAnimation(user, 'idle');
                    sendCharacterMessage('My inventory is full.', key, worldState);
                    return false;
                }
                break;
            }
            

        }

        return true;
    }
}