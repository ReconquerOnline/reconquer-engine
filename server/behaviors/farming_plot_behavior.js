export default class FarmingPlotBehavior {
    constructor(item, config) {
        this.item = structuredClone(item);
    }
    update(worldState) {
        var uuid = this.item.pub.i;
        var target = worldState.pub[uuid];
        var targetPriv = worldState.priv[uuid];

        if (!targetPriv.seed) return;

        if (targetPriv.harvestTicks > 0) {
            targetPriv.harvestTicks -= 1;
        }
        if (targetPriv.harvestTicks == 0) {
            targetPriv.seed = null;
            target.sst = 0;
            target.swa = 0;
            target.swe = 0;
            target.sf = 0;
            target.si = 0;
            return;
        }

        targetPriv.tick += 1;

        if (targetPriv.tick < targetPriv.time / .6) return;
        targetPriv.tick = 0;

        if (target.sd == 1) return;

        var random = Math.random();

        var failureChance = 0.2;
        if (targetPriv.failureChance) failureChance = targetPriv.failureChance;

        if (target.sst == 1 && target.swa == 1) { // seeded to small
            if (target.sf) {
                targetPriv.fertilizer += 1;
            }
            target.sst = 2;
            target.swa = 0;
            target.swe = 1;
            target.sf = 0;
            target.si = 2;
        } else if (target.sst == 2) { // small to medium
            if (target.swa == 0 && random < failureChance) {
                target.sd = 1;
                target.si = 3;
                target.swa = 0;
                target.sf = 0;
            } else {
                if (target.sf) {
                    targetPriv.fertilizer += 1;
                }
                target.swa = 0;
                target.sf = 0;
                target.sst = 3;
            }
        } else if (target.sst == 3) { // medium to tall
            if (target.swe == 1 || (target.swa == 0 && random < failureChance)) {
                target.sd = 1;
                target.si = 3;
                target.swa = 0;
                target.sf = 0;
            } else {
                if (target.sf) {
                    targetPriv.fertilizer += 1;
                }
                target.sst = 4;
                target.swa = 0;
                target.sf = 0;
            }
        } else if (target.sst == 4) { // tall to finished
            if (target.swa == 0 && random < failureChance) {
                target.sd = 1;
                target.si = 3;
                target.swa = 0;
                target.sf = 0;
            } else {
                if (target.sf) {
                    targetPriv.fertilizer += 1;
                }
                target.sst = targetPriv.finalState;
                target.swa = 0;
                target.swe = 0;
                target.sf = 0;
                target.si = 1;
                targetPriv.harvestTicks = Math.floor(4 * targetPriv.yield * Math.pow(1.25, targetPriv.fertilizer));
            }
        }
    }
}
