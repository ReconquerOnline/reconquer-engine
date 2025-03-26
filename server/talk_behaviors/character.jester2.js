import { overrideJesterConversation } from "../quests/q004_riddle_me_this_mace.js";

export default function handleInteraction(interaction, target, key, worldState) {
    return overrideJesterConversation(interaction, target, key, worldState)
}