import { moveAndRotateTowardsTarget } from "../action_utils.js";
import { definitions, setAnimation } from "../loader.js";
import { sendCharacterMessage, sendInfoTargetMessage } from "../message.js";
import { gainXp, getLevel } from "../skills.js";
import { addToFirstInventorySlot } from "../utils.js";
import ConfigOptions from "../config_options.js";

export default class HarvestAction {
    constructor(msg) {
        this.target = msg.ta;
        this.ticks = 0;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];
        var target = worldState.pub[this.target];
        var targetPriv = worldState.priv[this.target];

        if (definitions[target.t].behavior.type != 'farming_plot') {
            setAnimation(user, 'idle');
            return;
        } 

        var persist = moveAndRotateTowardsTarget(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        if (targetPriv.harvestTicks <= 0) {
            setAnimation(user, 'idle');
            return false;
        }

        var level = getLevel('farming', key, worldState);
        if (level < targetPriv.level) {
            sendInfoTargetMessage('I need at least level ' + targetPriv.level + ' farming to harvest this.', 'farming.svg', key, worldState);
            return;
        }

        if (userPriv.mem == 0 && targetPriv.level > ConfigOptions.maxFreeToPlayLevel) {
            sendInfoTargetMessage('I need membership to access content above level ' + ConfigOptions.maxFreeToPlayLevel + '.', 'logo.svg', key, worldState);
            setAnimation(user, 'idle');
            return false;
        }
        
        setAnimation(user, 'fish');
        this.ticks += 1;
        if (this.ticks == 4) {
            if (!definitions[targetPriv.yieldsItem]) { console.log('ERROR yieldsItem', targetPriv) }
            if (addToFirstInventorySlot(userPriv, definitions[targetPriv.yieldsItem], 1)) {
                gainXp('farming', Math.floor(targetPriv.experience / 2), key, worldState);
            } else {
                sendCharacterMessage('My inventory is full.', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }
            this.ticks = 0;
            
        }
        return true;
    }
}