import { segmentToPVPMultiplier } from "../loader.js";
import { sendInfoTargetMessage } from "../message.js";


export default class PVPAreaAction {
    constructor(msg) {
        this.interaction = msg.i;
        this.target = msg.ta;
    }
    static validate(msg) {
        return true;
    }
    handleImmediate(key, worldState) {

        var segX = worldState.pub[key].lsx;
        var segY = worldState.pub[key].lsy;

        var multiplier = segmentToPVPMultiplier[segX + '-' + segY] ?? 0;

        var fidelityLoss = worldState.serv[key].fidelityLoss ?? 0;
        var adjustment = Math.max(0, (1 - multiplier));
        var actualLoss = fidelityLoss * adjustment;
        sendInfoTargetMessage('I will lose ' + actualLoss + ' fidelity experience for defeating a player here and will do ' + (multiplier * 100) + '% of normal damage in player versus player combat.', 'exclamation.svg', key, worldState);
    }
}