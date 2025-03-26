import * as DenOfThieves from '../quests/q007_den_of_thieves.js';

export default function handleInteraction(interaction, target, key, worldState) {
    DenOfThieves.overrideVictimConversation(interaction, target, key, worldState);
}