import { setAnimation } from "../loader.js";
import { moveAndRotateTowardsTarget } from "../action_utils.js";

export default class TradeAction {
    constructor(msg) {
        this.target = msg.ta;
    }
    static validate(msg) {
        return typeof msg.ta == 'string';
    }
    handleTick(key, worldState) {
        var user = worldState.pub[key];
        var target = worldState.pub[this.target];

        if (!target || user.lf != target.lf || user.li != target.li || user.i == target.i) {
            setAnimation(user, 'idle')
            return false;
        }

        var persist = moveAndRotateTowardsTarget(user, target, key, worldState);
        if (persist !== undefined) {
            return persist;
        };

        setAnimation(user, 'idle');

        var targetPriv = worldState.priv[this.target];
        if (!targetPriv || !targetPriv.shop) {
            return false;
        };
        worldState.priv[key].mss += 1;
        worldState.priv[key].mst = target.i;
        return false;
    }
}