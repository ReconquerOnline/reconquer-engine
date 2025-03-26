import { overrideJesterConversation } from '../quests/q003_riddle_me_this_bread.js';

export default function handleInteraction(interaction, target, key, worldState) {
    return overrideJesterConversation(interaction, target, key, worldState)
}