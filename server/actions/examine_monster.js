import { definitions, setAnimation } from "../loader.js";
import { moveAndRotateTowardsTarget } from "../action_utils.js";
import { checkAttackLineOfSite } from "./move_action.js";
import { getBehavior } from "../behaviors.js";
import { sendInfoTargetMessage } from "../message.js";

export default class ExamineMonsterAction {
    constructor(msg) {
        this.target = msg.ta;
        this.interaction = msg.i;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var target = worldState.pub[this.target];

        if (!target || user.lf != target.lf || user.li != target.li) {
            setAnimation(user, 'idle')
            return false;
        }

        var persist = moveAndRotateTowardsTarget(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        setAnimation(user, 'idle');

        if (!checkAttackLineOfSite(user, target)) {
            return false;
        }

        if (!target.mhp) return false;

        var targetPriv = worldState.priv[this.target]
        var accuracy = targetPriv.kac;
        var strength = targetPriv.ksc;
        var archery = targetPriv.karc;
        var slashDefense = Math.floor(targetPriv.kdc + (targetPriv.esld ?? 0)/10);
        var stabDefense = Math.floor(targetPriv.kdc + (targetPriv.estd ?? 0)/10);
        var crushDefense = Math.floor(targetPriv.kdc + (targetPriv.ecrd ?? 0)/10);
        var archeryDefense = Math.floor(targetPriv.kdc + (targetPriv.eard ?? 0) / 10);
        var hitpoints = target.mhp;

        sendInfoTargetMessage('It has ' + hitpoints + ' hitpoints, ' + accuracy + ' accuracy, ' + strength + ' strength, '
            + archery + ' archery, ' + slashDefense + ' slash defense, ' + stabDefense + ' stab defense, '
            + crushDefense + ' crush defense, and ' + archeryDefense + ' archery defense.',
            this.target, key, worldState)

        return false;
    }
}