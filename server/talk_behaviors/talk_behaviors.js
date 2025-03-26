import CharacterFriend from "./character.friend.js";
import CharacterSmith from "./character.smith.js";
import Chest500500 from './chest.500-500.js';
import GoblinWarowitz from "./goblin.warowitz.js";
import CharacterBeggar from './character.beggar.js';
import CharacterBaker from './character.baker.js';
import CharacterFisher from './character.fisher.js';
import CharacterFisher2 from './character.fisher2.js';
import CharacterHero from './character.hero.js';
import CharacterJester from './character.jester.js';
import CharacterJester2 from './character.jester2.js';
import CharacterArcher from './character.archer.js';
import Mirror from './mirror.js';
import ChestBank from './chest_bank.js';
import CharacterKing from './character.king.js';
import GoblinMudblat from './goblin.mudblat.js';
import { overrideGrainBagKingConversation } from '../quests/q005_troll_boss.js';
import CharacterBrother from './character.brother.js';
import CharacterVictim from './character.victim.js';
import ChestDen from './chest.den.js';
import { overrideGardenerConversation } from "../quests/q008_royal_gardener.js";
import { overrideKnightConversation } from "../quests/q009_fight_arena.js";
import { CharacterResourceHandleInteraction } from "../resources.js";
import { overrideFarmerConversation } from "../quests/q011_chicken_boss.js";
import { overrideSageConversation } from "../quests/q012_innocent_blood.js";
import CharacterKnight from './character.knight.js';

export default {
    "character.friend": CharacterFriend,
    "character.smith": CharacterSmith,
    "chest.500-500": Chest500500,
    "goblin.warowitz": GoblinWarowitz,
    "character.beggar": CharacterBeggar,
    "character.baker": CharacterBaker,
    "character.fisher": CharacterFisher,
    "character.fisher2": CharacterFisher2,
    "character.hero": CharacterHero,
    "character.jester": CharacterJester,
    "character.jester2": CharacterJester2,
    "character.archer": CharacterArcher,
    "mirror": Mirror,
    "chest_bank": ChestBank,
    "character.king": CharacterKing,
    "goblin.mudblat": GoblinMudblat,
    "grain_bag.king": overrideGrainBagKingConversation,
    "character.brother": CharacterBrother,
    "character.victim": CharacterVictim,
    "chest.den": ChestDen,
    "character.gardener": overrideGardenerConversation,
    "character.knight": CharacterKnight,
    "character.resourceA": CharacterResourceHandleInteraction,
    "character.resourceB": CharacterResourceHandleInteraction,
    "character.farmer": overrideFarmerConversation,
    "character.sage": overrideSageConversation
}