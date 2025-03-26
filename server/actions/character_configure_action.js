import { characterOptions } from '../loader.js';

var keyToOptionsMap = {};
for (var option of characterOptions) {
    keyToOptionsMap[option.id] = option;
}

export default class CharacterConfigureAction {
    constructor(msg) {
        this.target = msg.ta;
        this.interaction = msg.i
    }
    static validate(msg) {
        return true
    }
    handleImmediate(key, worldState) {
        var pub = worldState.pub[key];
        var priv = worldState.priv[key];

        if (!priv.zedit) return;

        if (this.target ==  'gender') {
            pub.w = this.interaction == 1 ? 1 : 0;
            if (pub.w == 0) {
                if (pub.sha != 0) pub.sha = 2;
                if (pub.ss == 4) pub.ss = 0;
                if (pub.ss == 5) pub.ss = 1;
                if (pub.ss == 6) pub.ss = 2;
                if (pub.sl == 3) pub.sl = 0;
                priv.zha = 2;
                priv.zbe = pub.sbe;
            } else {
                if (pub.sha != 0) pub.sha = 8;
                if (pub.ss == 0) pub.ss = 4;
                if (pub.ss == 1) pub.ss = 5;
                if (pub.ss == 2) pub.ss = 6;
                if (pub.sl == 0) pub.sl = 3;
                pub.sbe = 0;
                priv.zha = 8;
                priv.zbe = 0;
            }
        }

        // options based on man/woman
        var option = keyToOptionsMap[this.target];
        if (!option) return false;

        var options = option.options;
        if (pub.w == 1 && option.optionsWoman) {
            options = option.optionsWoman;
        }

        var current = options.indexOf(pub[this.target]);
        if (this.interaction) {
            var next = (current + 1) % options.length;
            pub[this.target] = options[next];
        } else {
            var next = (current - 1 + options.length) % options.length;
            pub[this.target] = options[next];
        }

        priv.zha = pub.sha;
        priv.zbe = pub.sbe;

        if (priv.ihe) pub.sha = 0;
        if (priv.ihe.includes('full_helmet')) {
            pub.sbe = 0;
        }
    }
}