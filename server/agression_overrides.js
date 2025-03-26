import { overrideTrollGoblinAggression } from './quests/q005_troll_boss.js';
import { overrideImpAggression } from './quests/q006_imp_hunter.js';

export default {
    "goblin_boss": overrideTrollGoblinAggression,
    "goblin_monster": overrideTrollGoblinAggression,
    "giant_goblin": overrideTrollGoblinAggression,
    "imp": overrideImpAggression
}