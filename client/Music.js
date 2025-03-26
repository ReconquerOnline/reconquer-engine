import * as Loader from './Loader.js';
import * as Signals from './Signals.js';
import { Music, SoundEffects } from './Loader.js';

var synth;
var isPlaying = false;
var effectsEnabled = false;

var lastOverride = false;
var volume = 0.03;
function getVoice() {
    var voiceA = 1 + Math.floor(Math.random() * 4);
    var voiceB = 1 + Math.floor(Math.random() * 4);
    var override = false;

    var character = Loader.getCharacter();
    if (character) {
        if (character.userData.state.sa == 11) { // mining
            voiceA = 115 + Math.floor(Math.random() * 3);
            voiceB = 115 + Math.floor(Math.random() * 3);
            override = true;
        } else if (character.userData.state.sa == 22) { // praying
            voiceA = 19 + Math.floor(Math.random() * 2);
            voiceB = 19 + Math.floor(Math.random() * 2);
            override = true;
        } else if (character.userData.state.sa == 21 || character.userData.state.sa == 20) { // fishing
            voiceA = 71 + Math.floor(Math.random() * 6);
            voiceB = 71 + Math.floor(Math.random() * 6);
            override = true;
        }
    }

    if (override) {
        lastOverride = true;
    } else {
        lastOverride = false;
    }

    return {
        voiceA: voiceA,
        voiceB: voiceB,
        override: override
    };
}

function updateSegment(x, y) {    
    var voice = getVoice();
    var voiceA = voice.voiceA;
    var voiceB = voice.voiceB;

    var names = Loader.Config.segmentToSongs['500-500'];
    var name = names[Math.floor(Math.random() * names.length)];
    if (Loader.Config.segmentToSongs[x + '-' + y]) {
        names = Loader.Config.segmentToSongs[x + '-' + y];
        name = names[Math.floor(Math.random() * names.length)];
    }
    var binaryString = atob(Music[name + '.mid']);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    if (synth) {
        //fade out old music?
        synth.loadMIDI(bytes.buffer);
        synth.setChVol(1,50);
        setTimeout(() => {
            synth.send([0xc0, voiceA]);
            synth.send([0xc1, voiceB]);
            synth.setChVol(1,50);
        }, 0);

    }
}

var segX = 500;
var segY = 500;
Signals.subscribe('segmentChange', function (obj) {
    var forceUpdate = Loader.Config.forceSongChanges[segX + '-' + segY];
    var oldSongs = JSON.stringify(Loader.Config.segmentToSongs[segX + '-' + segY]);
    segX = obj.x;
    segY = obj.y;
    var newSongs = JSON.stringify(Loader.Config.segmentToSongs[segX + '-' + segY]);
    if ((forceUpdate || Loader.Config.forceSongChanges[segX + '-' + segY]) && oldSongs != newSongs) {
        updateSegment(segX, segY);
    }
});

var soundEffectRepeatTimeout = null;
var soundEffectTimeout = null;
export function playSoundEffect(effect, repeatTimeout) {
    var soundEffect = SoundEffects[effect + '.ogg'];
    if (!soundEffect) return;

    if (effectsEnabled) {
        var source = soundEffect.context.createBufferSource();

        var shift = Math.floor(Math.random() * 3) - 1;
        source.playbackRate.value =  Math.pow(2, shift*2 / 12); 

        var gain = soundEffect.context.createGain();
        gain.gain.value = volume / 0.03;
        source.buffer = soundEffect.buffer;
        source.connect(gain)
        gain.connect(soundEffect.context.destination);
        var delay = 0;
        if (repeatTimeout - soundEffect.buffer.duration * 1000 - 300 > 0) {
            delay = (repeatTimeout - soundEffect.buffer.duration * 1000 - 300);
        }
        var timeout = setTimeout(() => {
            source.start()
        }, delay)
        if (repeatTimeout) {
            soundEffectTimeout = timeout;
        }
    }

    if (repeatTimeout) {
        soundEffectRepeatTimeout = setTimeout(() => {
            playSoundEffect(effect, repeatTimeout);
        }, repeatTimeout)
    }
}

Signals.subscribe('hitpointDecrease', function (object) {
    if (object == Loader.getCharacter()) {
        playSoundEffect('damage', 0);
    }
})

Signals.subscribe('animationChange', (objectOption) => {
    var option = objectOption.option;

    var object = objectOption.object;
    var character = Loader.getCharacter();
    if (!character) return;
    if (object == character) {
        clearTimeout(soundEffectRepeatTimeout);
        clearTimeout(soundEffectTimeout);
        if (!option.effect) return;
        playSoundEffect(option.effect, Number(option.duration) * 1000);
        return;
    }

    var effect = option.effect;
    if (!effect) {
        if (option.name.includes('die')) {
            effect = 'generic_die';
        } else {
            return;
        }
    }

    var absXChar = character.userData.state.lsx * 64 + character.userData.state.lx;
    var absYChar = character.userData.state.lsy * 64 + character.userData.state.ly;

    var absXObj = object.userData.state.lsx * 64 + object.userData.state.lx;
    var absYObj = object.userData.state.lsy * 64 + object.userData.state.ly;

    var xDiff = absXChar - absXObj;
    var yDiff = absYChar - absYObj;

    var distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
    if (distance < 3) {
        playSoundEffect(effect, 0)
    }
})

Signals.subscribe('characterAnimationChange', function () {
    if (synth && isPlaying) {
        var forceOverride = lastOverride;
        var voice = getVoice();
        if (forceOverride || voice.override) {
            var voiceA = voice.voiceA;
            var voiceB = voice.voiceB;
            synth.send([0xc0, voiceA]);
            synth.send([0xc1, voiceB]);
            synth.setChVol(1,50);
        }
    }
});


setInterval(function () {
    if (!synth) return;
    if (!isPlaying) return;
    synth.setChVol(1,50);
    if (!synth.getPlayStatus().play) {
        updateSegment(segX, segY);
        synth.playMIDI();
    }
},50)

function changeInstrument() {
    if (synth) {
        var voice = getVoice();
        var voiceA = voice.voiceA;
        var voiceB = voice.voiceB;
        synth.send([0xc0, voiceA]);
        synth.send([0xc1, voiceB]);
        synth.setChVol(1,50);
    }
    setTimeout(changeInstrument, 3000 + Math.random() * 10000);
}
changeInstrument();

export function playMusic() {
    if (isPlaying) return;
    if (!synth) {
        synth = new WebAudioTinySynth({ voices: 64 });   
    }
    synth.setQuality(1);
    synth.setLoop(false);
    synth.setMasterVol(volume);
    synth.setReverbLev(0.6)

    updateSegment(segX, segY);
    synth.playMIDI();
    

    isPlaying = true;
}

export function stopMusic() {
    if (!synth) return;
    synth.stopMIDI();
    isPlaying = false;
}

export function enableSoundEffects() {
    effectsEnabled = true;
}
export function disableSoundEffects() {
    effectsEnabled = false;
}

export function setVolume(vol) {
    volume = .03 * Math.pow(10, (vol - 50)/ 30)
    if (synth) {
        synth.setMasterVol(volume);
    }
}