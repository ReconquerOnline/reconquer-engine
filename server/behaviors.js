import WalkBehavior from "./behaviors/walk_behavior.js";
import RespawnBehavior from './behaviors/respawn_behavior.js';
import RegenerateBehavior from './behaviors/regenerate_behavior.js';
import MonsterBehavior from "./behaviors/monster_behavior.js";
import ShopBehavior from "./behaviors/shop_behavior.js";
import FarmingPlotBehavior from "./behaviors/farming_plot_behavior.js";
import FireSpoutBehavior from "./behaviors/fire_spout_behavior.js";
import ProjectileBehavior from "./behaviors/projectile_behavior.js";
import DogBehavior from "./behaviors/dog_behavior.js";
import FightArenaBehavior from "./quests/q009_fight_arena.js";
import LighteningBehavior from "./behaviors/lightening_behavior.js";
import { EssenceForgeBehavior } from "./resources.js";
import RaidBehavior from "./behaviors/raid_behavior.js";

export default {
    "walk": WalkBehavior,
    "respawn": RespawnBehavior,
    "regenerate": RegenerateBehavior,
    "monster": MonsterBehavior,
    "farming_plot": FarmingPlotBehavior,
    "fire_spout": FireSpoutBehavior,
    "projectile": ProjectileBehavior,
    "dog": DogBehavior
}

var plugins = {
    'shop': new ShopBehavior(),
    'fight_arena': new FightArenaBehavior(),
    'lightening': new LighteningBehavior(),
    'essence_forge': new EssenceForgeBehavior(),
    'raid': new RaidBehavior()
};

export function addBehavior(behavior) {
    if (!behavior.item || !behavior.item.pub || !behavior.item.pub.i) return;
    var uuid = behavior.item.pub.i;
    plugins[uuid] = behavior;
}

export function removeBehavior(uuid) {
    delete plugins[uuid];
}

export function updateBehaviors(worldState) {
    for (var key in plugins) {
        var plugin = plugins[key];
        var remove = plugin.update(worldState);
        if (remove) {
            delete plugins[key];
        }
    }
}

export function getBehavior(target) {
    return plugins[target];
}