import * as HelpTheBakerQuest from '../quests/q001_help_the_baker.js';

export default function handleInteraction(interaction, target, key, worldState) {
    HelpTheBakerQuest.overrideBakerConversation(interaction, target, key, worldState);
}

