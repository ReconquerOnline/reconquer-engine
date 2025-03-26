import { sendNPCMessage } from '../message.js';
import * as ImpHunterQuest from '../quests/q006_imp_hunter.js';
import { overrideBrotherConversation } from '../quests/q012_innocent_blood.js';

export default function handleInteraction(interaction, target, key, worldState) {
    if (ImpHunterQuest.overrideBrotherConversation(interaction, target, key, worldState)) return;
    if (overrideBrotherConversation(interaction, target, key, worldState)) return;
    sendNPCMessage("Thank you for your help. The town seems healthier than ever.", target, key, worldState);
    sendNPCMessage("I think the imps have really calmed down.", target, key, worldState);
}

