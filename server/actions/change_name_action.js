import { adjectives, names } from "../loader.js";
import * as Database from '../database.js';

export default class ChangeNameAction {
    constructor(msg) {
        this.target = msg.ta;
        this.index = msg.i
    }
    static validate(msg) {
        return true
    }
    handleImmediate(key, worldState) {
        var pub = worldState.pub[key];
        var priv = worldState.priv[key];

        if (!priv.zedit) return;
        if (typeof this.index != 'number') return;

        if (this.target == 'name' && this.index >= 0 && this.index < names.length) {
            var splitName = pub.dn.split(' ');
            Database.getUniqueDisplayName(names[this.index], splitName[2]).then((result) => {
                Database.updateDisplayName(pub.i, result).then((queryResult) => {
                    if (queryResult.matchedCount != queryResult.modifiedCount) return;
                    pub.dn = result;
                }).catch((err) => { });
            }).catch((err) => { });
        } else if (this.target == 'descriptor' && this.index >= 0 && this.index < adjectives.length) {
            var splitName = pub.dn.split(' ');
            Database.getUniqueDisplayName(splitName[0], adjectives[this.index]).then((result) => {
                Database.updateDisplayName(pub.i, result).then((queryResult) => {
                    if (queryResult.matchedCount != queryResult.modifiedCount) return;
                    pub.dn = result;
                }).catch((err) => { });
            }).catch((err) => { });
        }
    }
}