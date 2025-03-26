import * as DenOfThieves from '../quests/q007_den_of_thieves.js';

export default function handleInteraction(interaction, target, key, worldState) {
    DenOfThieves.overrideChestDenConversation(interaction, target, key, worldState);
}