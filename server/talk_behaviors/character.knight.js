import { sendNPCMessage } from '../message.js';
import { overrideKnightConversation } from '../quests/q009_fight_arena.js';
import { overrideKnightConversationInnocentBlood } from '../quests/q012_innocent_blood.js';

export default function handleInteraction(interaction, target, key, worldState) {
    if (overrideKnightConversation(interaction, target, key, worldState)) return;
    if (overrideKnightConversationInnocentBlood(interaction, target, key, worldState)) return;
    sendNPCMessage("Great job again making it through the fight!", target, key, worldState);
}

