import { sendCharacterMessage, sendNPCMessage, sendOptionMessage } from '../message.js';
import Actions from '../actions.js';
import * as WorldState from '../world_state.js';

export default function handleInteraction(interaction, target, key, worldState) {
    if (interaction == 'Yes I would.') {
        sendNPCMessage('Take a look.', target, key, worldState);
        WorldState.addAction(key, new Actions.trade({
            ta: target.i,
        }));
        return true;
    } else if (interaction == 'No thank you.') {
        sendCharacterMessage("I'll just be going then.", key, worldState);
    } else {
        sendNPCMessage("I have some fishing things for sale. Do you want to trade?", target, key, worldState);
        sendOptionMessage(['Yes I would.', 'No thank you.'], target, key, worldState);
    }
}