import { setAnimation, examineMap, definitions, generatedInfoStrings } from "../loader.js";
import { sendCharacterMessage, sendInfoTargetMessage } from '../message.js';
import { moveWithinOneSquareAndRotateTowardsTargetIgnoreFinalWallCollision } from "../action_utils.js";
import { validArgs, validShopArgs, validTradeArgs, validBankArgs } from '../inventory.js';
import { distanceBetween, getMatch, matchesLocation } from '../utils.js';

export default class ExamineAction {
    constructor(msg) {
        this.target = msg.ta;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    sendItemMessage(idQuantity, key, worldState) {
        var id = idQuantity[0];

        var targetMessage = definitions[id].itemName

        if (typeof examineMap[id] == 'string') {
            targetMessage = examineMap[id];
        } else if (generatedInfoStrings[id]) {
            targetMessage = generatedInfoStrings[id];
        }

        if (definitions[id].stackable || idQuantity[1] > 1) {
            var formattedQuantity = idQuantity[1].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            if (!targetMessage.endsWith('.')) {
                targetMessage += '.';
            }
            targetMessage += ' Quantity: ' + formattedQuantity + '.';
        }

        sendInfoTargetMessage(targetMessage, idQuantity, key, worldState)
    }
    handleImmediate(key, worldState) {
        if (validArgs[this.target]) {
            var idQuantity = worldState.priv[key][this.target];
            if (!idQuantity || !idQuantity[0]) return;
            this.sendItemMessage(idQuantity, key, worldState);
            return false;
        } else if (validShopArgs[this.target]) {
            var shopTarget = worldState.priv[key].mst;
            var shop = worldState.pub[shopTarget];
            if (!shop) return;
            var idQuantity = shop[this.target];
            if (!idQuantity || !idQuantity[0]) return;
            this.sendItemMessage(idQuantity, key, worldState);
            return false;
        } else if (validTradeArgs[this.target]) {
            var tradeTarget = worldState.priv[key].mpt;
            var trader = worldState.pub[tradeTarget];
            if (!trader) return;
            var idQuantity = trader[this.target];
            if (!idQuantity || !idQuantity[0]) return;
            this.sendItemMessage(idQuantity, key, worldState);
            return false;
        } else if (validBankArgs[this.target]) {
            var idQuantity = worldState.priv[key][this.target];
            if (!idQuantity || !idQuantity[0]) return;
            this.sendItemMessage(idQuantity, key, worldState);
            return false;
        }
        return true;
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var target = worldState.pub[this.target];

        if (!target || user.lf != target.lf || user.li != target.li) {
            setAnimation(user, 'idle');
            return false;
        }

        var persist = moveWithinOneSquareAndRotateTowardsTargetIgnoreFinalWallCollision(user, target, key, worldState);
        if (persist !== undefined && !matchesLocation(user, target)) {
            if (persist) {
                return true;
            } else if (persist == false && distanceBetween(user, target) > 1) {
                return false;
            }
        };
        setAnimation(user, 'idle');

        var targetPriv = worldState.priv[this.target];
        var targetId = targetPriv ? targetPriv.id : null;
        var examineEntry = examineMap[target.t];
        if (!examineEntry) {
            if (!definitions[target.t].itemId) return;
            sendInfoTargetMessage(definitions[target.t].itemName, this.target, key, worldState);
            return;
        }

        var result = getMatch(target, targetId, examineEntry);
        if (result) {
            sendInfoTargetMessage(result, this.target, key, worldState);
            return
        }

        sendCharacterMessage('I don\'t see anything interesting.', key, worldState);
        return false;
    }
}