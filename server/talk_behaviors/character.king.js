import * as TrollBossQuest from '../quests/q005_troll_boss.js';

export default function handleInteraction(interaction, target, key, worldState) {
    TrollBossQuest.overrideKingConversation(interaction, target, key, worldState);
}

