import ConfigOptions from "../config_options.js";
import { definitions, setAnimation } from "../loader.js";
import { sendInfoTargetMessage } from "../message.js";
import { gainXp, getLevel } from "../skills.js";
import { addToFirstInventorySlot, getItemSlot, getTotalQuantityOfItemInInventory, linearInterpolate, removeAmountFromSlot } from "../utils.js";

export default class FarmingPlotUtilityAction {
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

        if (Math.random() > 0.8) {
            addToFirstInventorySlot(worldState.priv[key], definitions['worms'], 1)
        }

        setAnimation(user, 'fish');
        this.ticks += 1;
        if (this.ticks == 4) {

            setAnimation(user, 'idle');

            var target = this.target;
            var targetPriv = worldState.priv[target.i];

            var definition = this.items[0].interaction;

            var farmingLevel = getLevel('farming', key, worldState);
            if (farmingLevel < definition.level) {
                sendInfoTargetMessage('I need at least level ' + definition.level + ' farming to plant this.', 'farming.svg', key, worldState);
                return;
            }
            if (userPriv.mem == 0 && definition.level > ConfigOptions.maxFreeToPlayLevel) {
                sendInfoTargetMessage('I need membership to access content above level ' + ConfigOptions.maxFreeToPlayLevel + '.', 'logo.svg', key, worldState);
                setAnimation(user, 'idle');
                return false;
            }
            // make sure user has enough seeds
            if (userPriv[itemSlot][1] < definition.quantity) {
                sendInfoTargetMessage('I need at least ' + definition.quantity + ' seeds.', [this.itemId, definition.quantity], key, worldState);
                return;
            }

            if (target.sst != 0) {
                sendInfoTargetMessage('Something is already planted here', target.i, key, worldState);
                return;
            }

            target.sst = 1;
            removeAmountFromSlot(itemSlot, definition.quantity, userPriv);
            gainXp('farming', definition.experience, key, worldState);
            targetPriv.seed = this.itemId;
            targetPriv.tick = 0;
            targetPriv.fertilizer = 0;
            targetPriv.harvestTicks = -1;
            targetPriv.yield = definition.yield;
            targetPriv.yieldsItem = definition.yieldsItem;
            targetPriv.level = definition.level;
            targetPriv.time = definition.time;
            targetPriv.finalState = definition.finalState;
            targetPriv.experience = definition.experience;
            targetPriv.failureChance = definition.failureChance;
            target.sd = definition.baseStateDead ? definition.baseStateDead : 0;
            
            return false;
        }
        return true;
    }
}