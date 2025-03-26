import { sendCharacterMessage, sendNPCMessage, sendOptionMessage } from '../message.js';
import Actions from '../actions.js';
import * as WorldState from '../world_state.js';

export default function handleInteraction(interaction, target, key, worldState) {
    if (interaction == 'Yes I would.') {
        sendNPCMessage('Take a look at my shop.', target, key, worldState);
        WorldState.addAction(key, new Actions.trade({
            ta: target.i,
        }));
        return true;
    } else if (interaction == 'No thank you.') {
        sendNPCMessage('Alrighty then.', target, key, worldState);
    } else if (interaction == 'Tell me about smithing.') {
        sendNPCMessage("To start smithing, you're going to need to get yourself a pair of gloves.", target, key, worldState);
        sendNPCMessage("I made these out of cow hide and linen thread.", target, key, worldState);
        sendNPCMessage("I also needed a knife to cut the leather into the right shape.", target, key, worldState);
        sendNPCMessage("Once you have your gloves, then you need to mine some ore and smelt it in this furnace.", target, key, worldState);
        sendNPCMessage("Then you just knock the metal bars into the right shape using a hammer on this anvil.", target, key, worldState);
        sendCharacterMessage("Thanks that helps.", key, worldState);
    } else {
        sendNPCMessage("Hi. I'm the smith. Welcome to my shop. Would you like to trade?", target, key, worldState);
        sendOptionMessage(['Yes I would.', 'No thank you.', 'Tell me about smithing.'], target, key, worldState);
    }
}