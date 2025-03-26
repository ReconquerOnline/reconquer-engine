import { sendNPCMessage, sendCharacterMessage } from '../message.js';

export default function handleInteraction(interaction, target, key, worldState) {
    sendCharacterMessage('Hello.', key, worldState);
    sendNPCMessage("There's some fish around here.", target, key, worldState);
    sendNPCMessage("Some spots are good. Some spots are not so good.", target, key, worldState);
}

