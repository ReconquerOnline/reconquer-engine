import { sendNPCMessage } from '../message.js';
import * as HelpTheHeroQuest from '../quests/q002_help_the_hero.js';
import { overrideHeroConversation } from '../quests/q012_innocent_blood.js';

export default function handleInteraction(interaction, target, key, worldState) {
    if (HelpTheHeroQuest.overrideHeroConversation(interaction, target, key, worldState)) return true;
    if (overrideHeroConversation(interaction, target, key, worldState)) return true;
    sendNPCMessage('Greetings hero. Continue on in your pursuit of the knighthood.', target, key, worldState);
}

