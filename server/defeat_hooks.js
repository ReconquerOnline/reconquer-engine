import { GoblinBossDefeatHook } from './quests/q000_tutorial_island.js';
import { GoblinMonsterDefeatHook } from './quests/q002_help_the_hero.js';
import { WolfDefeatHook } from './quests/q002_help_the_hero.js';
import { TrollBossDefeatHook } from './quests/q005_troll_boss.js';
import { GiantGoblinDefeatHook, ImpDefeatHook } from './quests/q006_imp_hunter.js';
import { ChickenBossDefeatHook } from './quests/q011_chicken_boss.js';
import { DragonBossDefeatHook, PydarDefeatHook, WaterGoblinDefeatHook } from './quests/q012_innocent_blood.js';

export default {
    "goblin_boss": GoblinBossDefeatHook,
    "goblin_monster": GoblinMonsterDefeatHook,
    "wolf": WolfDefeatHook,
    "troll_boss": TrollBossDefeatHook,
    "imp": ImpDefeatHook,
    "giant_goblin": GiantGoblinDefeatHook,
    "chicken_boss": ChickenBossDefeatHook,
    "pidar": PydarDefeatHook,
    "dragon_boss": DragonBossDefeatHook
}

export var TargetDefeatHooks = {
    "water_goblin": WaterGoblinDefeatHook
}