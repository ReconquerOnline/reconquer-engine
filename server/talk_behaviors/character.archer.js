import { sendCharacterMessage, sendNPCMessage, sendOptionMessage } from '../message.js';
import Actions from '../actions.js';
import * as WorldState from '../world_state.js';

export default function handleInteraction(interaction, target, key, worldState) {
    if (interaction == 'Do you have anything for sale?') {
        sendNPCMessage('Take a look.', target, key, worldState);
        WorldState.addAction(key, new Actions.trade({
            ta: target.i,
        }));
        return true;
    } else if (interaction == 'How do I make bows?') {
        sendNPCMessage("It takes one poplar log to create a shortbow, two to create a crossbow, and three to create a longbow.", target, key, worldState);
        sendNPCMessage("Of course you need a knife to carve it.", target, key, worldState);
        sendNPCMessage("Then you can use string made of out of flax to string the bows.", target, key, worldState);
        sendCharacterMessage("Thanks.", key, worldState);
    } else {
        sendNPCMessage("Hi. I'm an archer.", target, key, worldState);
        sendOptionMessage(['Do you have anything for sale?', 'How do I make bows?'], target, key, worldState);
    }
}