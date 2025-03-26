import * as TutorialIslandQuest from '../quests/q000_tutorial_island.js';

export default function handleInteraction(interaction, target, key, worldState) {
    TutorialIslandQuest.overrideFriendConversation(interaction, target, key, worldState)
}

