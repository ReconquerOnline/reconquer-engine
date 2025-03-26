import { GiantGoblinAttackOverride } from './giant_goblin_attack_override.js';
import { PidarAttackOverride } from './pidar_attack_override.js';
import { MountainGoblinAttackOverride } from './mountain_goblin_attack_override.js';
import { TrollBossAttackOverride } from './troll_boss_attack_override.js';
import { ChickenBossAttackOverride } from './chicken_boss_attack_override.js';
import { DragonRangerOverride } from './dragon_ranger_override.js';
import { IdolMonsterAttackOverride } from './idol_monster_override.js';
import { DragonBossOverride } from './dragon_boss_attack_override.js';

export default {
    "goblin_boss": GiantGoblinAttackOverride,
    "giant_goblin": GiantGoblinAttackOverride,
    "giant_goblin_round": GiantGoblinAttackOverride,
    "giant_goblin_square": GiantGoblinAttackOverride,
    "giant_goblin_kite": GiantGoblinAttackOverride,
    "troll_boss": TrollBossAttackOverride,
    "mountain_goblin": MountainGoblinAttackOverride,
    "pidar": PidarAttackOverride,
    "chicken_boss": ChickenBossAttackOverride,
    "dragon_ranger": DragonRangerOverride,
    "idol_monster": IdolMonsterAttackOverride,
    "dragon_boss": DragonBossOverride
}