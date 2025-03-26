import { updateEquipmentBonuses } from '../action_utils.js';
import { validArgs } from '../inventory.js';
import { definitions, materialToLevelMap } from '../loader.js';
import RemoveAction from './remove_action.js';
import { sendInfoTargetMessage } from '../message.js';
import { getLevel } from '../skills.js';
import ConfigOptions from '../config_options.js';
export default class WearAction {
    constructor(msg) {
        this.target = msg.ta;
    }
    static validate(msg) {
        return validArgs[msg.ta];
    }
    handleImmediate(key, worldState) {
        var user = worldState.pub[key];
        var userPriv = worldState.priv[key];

        if (userPriv[this.target][0] === undefined) return;

        var type = userPriv[this.target][0];
        var wearBehavior = definitions[type].wearBehavior;
        if (!wearBehavior) return;

        if (wearBehavior.skill && wearBehavior.level && getLevel(wearBehavior.skill, key, worldState) < wearBehavior.level) {
            sendInfoTargetMessage('I need level ' + wearBehavior.level + ' ' + wearBehavior.skill + '.', [type, 1], key, worldState);
            return;
        }

        var material = type.split('_')[0];
        var level = materialToLevelMap[material] ? materialToLevelMap[material] : 1;
        if (wearBehavior.level) {
            level = wearBehavior.level;
        }
        var skill = 'accuracy'
        var slot = wearBehavior.slot;
        if (wearBehavior.skill) {
            skill = wearBehavior.skill;
        } else if (slot == 'iw' && wearBehavior.twoHand) {
            skill = 'strength';
        } else if (slot == 'iw' && !wearBehavior.twoHand) {
            skill = 'accuracy';
        } else {
            skill = 'defense';
        }
        if (getLevel(skill, key, worldState) < level) {
            sendInfoTargetMessage('I need level ' + level + ' ' + skill + ' to wield this.', [type, 1], key, worldState);
            return;
        }
        if (userPriv.mem == 0 && level > ConfigOptions.maxFreeToPlayLevel) {
            sendInfoTargetMessage('I need membership to access content above level ' + ConfigOptions.maxFreeToPlayLevel + '.', 'logo.svg', key, worldState);
            setAnimation(user, 'idle');
            return false;
        }

        var oldEquipment = userPriv[slot];
        if (wearBehavior.twoHand && userPriv['ish']) {
            new RemoveAction({ ta: 'ish' }).handleImmediate(key, worldState);
            if (userPriv['ish'] != '') return;
        } else if (slot == 'ish' &&
            userPriv['iw'] &&
            definitions[userPriv['iw']].wearBehavior.twoHand) {
            new RemoveAction({ ta: 'iw' }).handleImmediate(key, worldState);
            if (userPriv['iw'] != '') return;
        }

        userPriv[slot] = type;
        for (var key in wearBehavior.change) {
            user[key] = wearBehavior.change[key];
        }

        if (user.w && user.ss == 1) { user.ss = 5; }
        if (user.w && user.ss == 2) { user.ss = 6; }
        // remove hair state when wearing a helmet
        if (userPriv.ihe.includes('helmet')) {
            user.sha = 0;
        } else {
            user.sha = userPriv.zha;
        }
        if (userPriv.ihe.includes('full_helmet')) {
            user.sbe = 0;
        } else {
            user.sbe = userPriv.zbe;
        }
        userPriv[this.target] = [];
        if (oldEquipment) {
            userPriv[this.target] = [oldEquipment, 1];
        }
        updateEquipmentBonuses(userPriv);
    }
}