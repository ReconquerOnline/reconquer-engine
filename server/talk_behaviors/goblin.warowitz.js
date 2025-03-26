import { sendNPCMessage } from '../message.js';
import * as TutorialIslandQuest from '../quests/q000_tutorial_island.js';

export default function handleInteraction(interaction, target, key, worldState) {
    if (TutorialIslandQuest.overrideWarowitzConversation(interaction, target, key, worldState)) {
        return;
    }
    sendNPCMessage("Heh heeh heh.", target, key, worldState);
}