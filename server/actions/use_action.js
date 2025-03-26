import { definitions, setAnimation } from "../loader.js";
import { sendCharacterMessage } from '../message.js';
import { moveAndRotateTowardsTarget } from "../action_utils.js";
import { validArgs } from '../inventory.js';
import { matchesLocation } from "../utils.js";
import DefaultAction from "../use_actions/default.js";
import CookingUtilityAction from '../use_actions/cooking_utility.js';
import IgnitionUtilityAction from "../use_actions/ignition_utility.js";
import FurnaceUtilityAction from "../use_actions/furnace_utility.js";
import AnvilUtilityAction from "../use_actions/anvil_utility.js";
import FarmingPlotUtilityAction from "../use_actions/farming_plot_utility.js";
import FarmingPlotWaterUtilityAction from "../use_actions/farming_plot_water_utility.js";
import FarmingPlotFertilizerUtilityAction from "../use_actions/farming_plot_fertilizer_utility.js";
import { CharacterJesterUseHandler } from "../quests/q003_riddle_me_this_bread.js";
import FurnaceCombiningUtilityAction from "../use_actions/furnace_combining_utility.js";
import { CharacterJester2UseHandler } from "../quests/q004_riddle_me_this_mace.js";
import { GrainBagKingUseHandler } from "../quests/q005_troll_boss.js";
import FoodUtilityAction from "../use_actions/food_utility.js";
import FireExtinguishUtilityAction from "../use_actions/fire_extinguish_utility.js";
import { DogUseHandler } from "../behaviors/dog_behavior.js";
import { EssenceForgeUtilityAction } from "../resources.js";
import { PackmuleUseHandler } from "./pat_action.js";
import ChickenBossUtility from "../use_actions/chicken_boss_utility.js";
import NailUtility from "../use_actions/nail_utility.js";
import { IdolMonsterUseHandler } from "../behaviors/raid_behavior.js";

var UseActions = {
    "default": DefaultAction,
    "cooking_utility": CookingUtilityAction,
    "ignition_utility": IgnitionUtilityAction,
    "furnace_utility": FurnaceUtilityAction,
    "anvil_utility": AnvilUtilityAction,
    "farming_plot_water_utility": FarmingPlotWaterUtilityAction,
    "farming_plot_fertilizer_utility": FarmingPlotFertilizerUtilityAction,
    "grain_plot_utility": FarmingPlotUtilityAction,
    "herb_plot_utility": FarmingPlotUtilityAction,
    "furnace_combining_utility": FurnaceCombiningUtilityAction,
    "food_utility": FoodUtilityAction,
    "fire_extinguish_utility": FireExtinguishUtilityAction,
    "essence_forge_utility": EssenceForgeUtilityAction,
    "chicken_boss_utility": ChickenBossUtility,
    "nail_utility": NailUtility,
}

var TalkHandlers = {
    "character.jester": CharacterJesterUseHandler,
    "character.jester2": CharacterJester2UseHandler,
    "grain_bag.king": GrainBagKingUseHandler,
    "dog": DogUseHandler,
    "packmule.a": PackmuleUseHandler,
    "idol_monster": IdolMonsterUseHandler
}

export default class UseAction {
    constructor(msg) {
        this.A = msg.uA;
        this.B = msg.uB;
        this.C = msg.uC;
        this.D = msg.uD;
        this.target = msg.ta;
        this.interaction = msg.i;
        this.action = null;
    }
    static validate(msg) {
        return validArgs[msg.uA] && typeof msg.ta == 'string';
    }
    nothingHappens(key, worldState) {
        sendCharacterMessage('Nothing happens.', key, worldState);
    }
    checkInteraction(interaction, itemQuantity) {
        if (!itemQuantity || !itemQuantity[0]) return false;
        var itemId = itemQuantity[0];
        var definition = definitions[itemId];
        if (!definition) return false;
        if (!definition.useSourceInteractions) return false;
        for (var sourceInteraction of definition.useSourceInteractions) {
            if (sourceInteraction.type == interaction) return sourceInteraction;
        }
        return false;

    }
    checkTargetInteractions(target, validSources, key, worldState) {
        var userPriv = worldState.priv[key];

        // if target.priv matches talk handlers, use talk handler
        var targetPriv = worldState.priv[target.i];
        if (targetPriv && targetPriv.id) {
            var id = targetPriv.id;
            if (TalkHandlers[id]) {
                TalkHandlers[id](validSources, key, worldState, target);
                return false;
            }
        }

        var targetDefinition = definitions[target.t];
        if (!targetDefinition) return;
        var targetInteractions = targetDefinition.useTargetInteractions;
        if (!targetInteractions) return;
        for (var interaction of targetInteractions) {
            var items = [];
            for (var source of validSources) {
                var sourceInteraction = this.checkInteraction(interaction, userPriv[source]);
                if (sourceInteraction) {
                    items.push({
                        interaction: sourceInteraction,
                        slot: source
                    });
                }
            }
            if (items.length > 0) {
                var UseAction = UseActions[interaction] ? UseActions[interaction] : UseActions['default'];
                this.action = new UseAction(target, items, this.interaction);
                return this.action.handleTick(key, worldState);
            }
        }
    }
    handleTick(key, worldState) {

        if (this.action) return this.action.handleTick(key, worldState);

        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];
        var target = worldState.pub[this.target];
        if (validArgs[this.target] && userPriv[this.target]) {
            target = {
                t: userPriv[this.target][0],
                i: null,
                lf: user.lf,
                li: user.li
            }
        }

        if (!target || user.lf != target.lf || user.li != target.li) {
            setAnimation(user, 'idle');
            this.nothingHappens(key, worldState);
            return false;
        }

        if (target.i) {
            var persist = moveAndRotateTowardsTarget(user, target, key, worldState);
            if (persist !== undefined && !matchesLocation(user, target)) {
                return persist;
            };
        }

        setAnimation(user, 'idle');
        if (target.i && definitions[target.t].itemId) {
            this.nothingHappens(key, worldState);
            return false;
        }

        var validSources = [this.A];
        if (validArgs[this.B] && !validSources.includes(this.B)) {
            validSources.push(this.B);
        }
        if (validArgs[this.C] && !validSources.includes(this.C)) {
            validSources.push(this.C);
        }
        if (validArgs[this.D] && !validSources.includes(this.D)) {
            validSources.push(this.D);
        }

        var result = this.checkTargetInteractions(target, validSources, key, worldState);
        if (result !== undefined) {
            return result;
        }

        // try to swap source and target if there is only one valid source and target is item
        if (!target.i && validSources.length == 1 && userPriv[this.A]) {
            var result = this.checkTargetInteractions({
                t: userPriv[this.A][0]
            }, [this.target], key, worldState);
            if (result !== undefined) {
                return result;
            }
        }

        this.nothingHappens(key, worldState);
        return false;
    }
}