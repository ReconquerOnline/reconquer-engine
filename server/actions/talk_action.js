import { getAnimationName, setAnimation } from "../loader.js";
import { sendCharacterMessage } from '../message.js';
import { moveAndRotateTowardsTarget } from "../action_utils.js";
import TalkBehavior from "../talk_behaviors/talk_behaviors.js";
import Actions from '../actions.js';
import * as WorldState from '../world_state.js';
import { ResetAccountTalkBehavior } from "./reset_account_action.js";
import { checkAttackLineOfSite } from "./move_action.js";

var selfTalkHandlers = {
    "reset_account": ResetAccountTalkBehavior,
}

export default class TalkAction {
    constructor(msg) {
        this.target = msg.ta;
        this.interaction = msg.i;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
    
        if (selfTalkHandlers[this.target]) {
            setAnimation(user, 'idle')
            return selfTalkHandlers[this.target](this.interaction, key, worldState);
        }

        var target = worldState.pub[this.target];

        if (!target || user.lf != target.lf || user.li != target.li) {
            sendCharacterMessage('Where did he go?', key, worldState);
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

        var targetPriv = worldState.priv[this.target];
        if (!targetPriv || !targetPriv.id || !TalkBehavior[targetPriv.id]) {
            sendCharacterMessage('Hello.', key, worldState);
            return false;
        };

        if (getAnimationName(target, target.sa) == 'idle') {
            WorldState.addAction(target.i, new Actions.rotate({
                ta: key,
            }));
        }

        return TalkBehavior[targetPriv.id](this.interaction, target, key, worldState);
    }
}