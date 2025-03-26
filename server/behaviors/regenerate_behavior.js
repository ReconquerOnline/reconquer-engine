
export default class RegenerateBehavior {
    constructor(item, config) {
        this.item = structuredClone(item);
        this.pubString = JSON.stringify(item.pub)
        this.config = config;
        this.respawnTime = config.respawnTime;
        this.ticksEmpty = 0;
    }
    update(worldState) {
        var uuid = this.item.pub.i;
        var target = worldState.pub[uuid];
        if (this.pubString == JSON.stringify(target)) {
            this.ticksEmpty = 0;
            return;
        }
        this.ticksEmpty += 1;
        if (this.ticksEmpty > this.respawnTime / 0.6) {
            for (var key in this.item.pub) {
                target[key] = this.item.pub[key];
            }
            this.ticksEmpty = 0;
        }
    }
}
