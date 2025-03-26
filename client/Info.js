import { Panel, Text, Button, Input } from './UI.js';
import * as Signals from './Signals.js';
import Chat from './Chat.js';
import { SVG } from './Loader.js';
import { getCharacterId } from './Loader.js';
import { capitalizeFirstLetter, addToolTip, extractFirstInt } from './Utils.js';
import { Config } from './Loader.js';
import { svgToImage } from './Utils.js';
import * as Communication from './Communication.js';
import { playMusic, stopMusic, enableSoundEffects, disableSoundEffects, setVolume } from './Music.js';
import Toolbar from './Toolbar.js';
import QuestsPanel from './QuestsPanel.js'
import SettingsPanel from './SettingsPanel.js'
import { clearMacro, playMacro, recordMacro, stopMacro, stopRecordingMacro } from './Macro.js';
import { updateRenderState } from './Viewport.js';
import EquipmentPanel from './EquipmentPanel.js';
import { handleExperienceChange } from './ExperiencePanel.js';

const container = new Panel()
export default container;
container.setClass('Info');

Chat.decorate(container);
container.hide();

var panels = [];
for (var r = 0; r < 3; r++) {
    for (var c = 0; c < 10; c++) {
        var panel = new Panel()
            .setWidth('58px')
            .setHeight('48px')
            .setPosition('absolute')
            .setLeft(c * 60 + 'px')
            .setTop(r * 50 + 'px')
            .setBackgroundColor('#ffffff')
            .setOpacity(0.5)
            .setBorder('1px solid #cccccc');
        if (c == 0) panel.setBorderLeft('0px solid').setWidth('59px')
        if (c == 9) panel.setBorderRight('0px solid').setWidth('59px')
        if (r == 0) panel.setBorderTop('0px solid').setHeight('49px')
        if (r == 2) panel.setBorderBottom('0px solid').setHeight('49px')
        if (c >= 5) {
            panel.setBackgroundColor('#eeeeee');
            if (r == 2 && c >= 7) {
                panel.setBorder('');
                panel.setWidth('60px');
                panel.setHeight('50px')
            }
        }
        panel.onDragOver(x => x.preventDefault());
        container.add(panel);
        panels.push(panel)
    }
}

var logoutButton = new Button()
    .setPosition('absolute')
    .setLeft('542px')
    .setBackgroundColor('#cccccc')
    .setWidth('56px')
    .setColor('#555555')
    .setBorderRadius('10px')
    .setFontWeight('bold')
    .setBottom('2px')
    .setHeight('46px')
    .setOpacity('0.9');
container.add(logoutButton);
var logoutText = new Text()
    .setTextContent('Logout')
    .setWidth('100%')
    .setTextAlign('center')
    .setFontSize('12px')
    .setPosition('absolute')
    .setTop('6px')
    .setLeft('0px')
logoutButton.add(logoutText);
var remainingText = new Text()
    .setTextContent('13:24 remaining')
    .setWidth('100%')
    .setTextAlign('center')
    .setFontSize('12px')
    .setPosition('absolute')
    .setBottom('6px')
    .setLeft('0px')
    .setDisplay('inline-block')
logoutButton.add(remainingText);

logoutButton.onClick(() => {
    Communication.logout();
});

var skillList = [
    'health', 'accuracy', 'strength', 'defense', 'archery',
    'fidelity', 'forestry', 'fishing', 'cooking', 'crafting',
    'mining', 'smithing', 'farming', 'combat'
];

var skills = {};
var chatButton, chatTooltipText, musicButton, musicTooltipText;
var soundEffectsButton, soundEffectsTooltipText, membershipButton;

Signals.subscribe('assetsLoaded', function () {

    var playButton = new Button()
        .setPosition('absolute')
        .setLeft('362px')
        .setBackgroundColor('#cccccc')
        .setWidth('56px')
        .setColor('#555555')
        .setBorderRadius('10px')
        .setFontWeight('bold')
        .setBottom('102px')
        .setHeight('46px')
        .setOpacity('0.9');
    container.add(playButton);
    var playImage = new svgToImage(SVG['play.svg'])
        .setWidth('40px')
        .setHeight('40px')
        .setPosition('absolute')
        .setTop('1px')
        .setLeft('6px');
    playButton.add(playImage);
    var playTooltipText = addToolTip(playButton, 'Play Recording');
    playButton.onClick(() => {
        playButton.isActive = !playButton.isActive;
        if (playButton.isActive ) {
            if (recordButton.isActive) {
                recordTooltip.setTextContent('Record Actions');
                recordButton.setBackgroundColor('#cccccc');
                recordButton.isActive = false;
                stopRecordingMacro();
            }
            playTooltipText.setTextContent('Stop Playback')
            playButton.setBackgroundColor('#aaaaaa')
            playMacro();
        } else {
            playTooltipText.setTextContent('Play Recording')
            playButton.setBackgroundColor('#cccccc')
            stopMacro();
        }
    });
    var recordButton = new Button()
        .setPosition('absolute')
        .setLeft('302px')
        .setBackgroundColor('#cccccc')
        .setWidth('56px')
        .setColor('#555555')
        .setBorderRadius('10px')
        .setFontWeight('bold')
        .setBottom('102px')
        .setHeight('46px')
        .setOpacity('0.9');
    container.add(recordButton);
    var recordImage = new svgToImage(SVG['record.svg'])
        .setWidth('40px')
        .setHeight('40px')
        .setPosition('absolute')
        .setTop('1px')
        .setLeft('6px');
    recordButton.add(recordImage);
    var recordTooltip = addToolTip(recordButton, 'Record Actions');
    recordButton.onClick(() => {
        recordButton.isActive = !recordButton.isActive;
        if (recordButton.isActive ) {
            if (playButton.isActive) {
                playTooltipText.setTextContent('Play Recording');
                playButton.setBackgroundColor('#cccccc');
                stopMacro();
                playButton.isActive = false;
            }
            recordTooltip.setTextContent('Stop Recording');
            recordButton.setBackgroundColor('#aaaaaa');
            recordMacro();
        } else {
            recordTooltip.setTextContent('Record Actions');
            recordButton.setBackgroundColor('#cccccc');
            stopRecordingMacro();
        }
    });
    Signals.subscribe('characterDeath', function () {
        recordButton.isActive = false;
        recordTooltip.setTextContent('Record Actions');
        recordButton.setBackgroundColor('#cccccc');

        playButton.isActive = false;
        playTooltipText.setTextContent('Play Recording');
        playButton.setBackgroundColor('#cccccc');

        stopMacro();
        stopRecordingMacro();
    })
    Signals.subscribe('disconnect', function () {
        recordButton.isActive = false;
        recordTooltip.setTextContent('Record Actions');
        recordButton.setBackgroundColor('#cccccc');

        playButton.isActive = false;
        playTooltipText.setTextContent('Play Recording');
        playButton.setBackgroundColor('#cccccc');

        stopRecordingMacro();
        stopMacro();

        for (var i = 0; i < skillList.length; i++) {
            var name = skillList[i];
            skills[name].currentExperience.setTextContent('Current xp: ')
        }
    })

    var resetAccountButton = new Button()
        .setPosition('absolute')
        .setLeft('542px')
        .setBackgroundColor('#cccccc')
        .setWidth('56px')
        .setColor('#555555')
        .setBorderRadius('10px')
        .setFontWeight('bold')
        .setBottom('52px')
        .setHeight('46px')
        .setOpacity('0.9');
    container.add(resetAccountButton);
    var resetAccountImage = new svgToImage(SVG['trash.svg'])
        .setWidth('40px')
        .setHeight('40px')
        .setPosition('absolute')
        .setTop('1px')
        .setLeft('6px');
    resetAccountButton.add(resetAccountImage);
    addToolTip(resetAccountButton, 'Reset account')
    resetAccountButton.onClick(() => {
        Communication.interact(null, { type: 'reset_account' });
    });

    var timePlayedButton = new Button()
        .setPosition('absolute')
        .setLeft('482px')
        .setBackgroundColor('#cccccc')
        .setWidth('56px')
        .setColor('#555555')
        .setBorderRadius('10px')
        .setFontWeight('bold')
        .setBottom('52px')
        .setHeight('46px')
        .setOpacity('0.9');
    container.add(timePlayedButton);
    var timePlayedImage = new svgToImage(SVG['time.svg'])
        .setWidth('40px')
        .setHeight('40px')
        .setPosition('absolute')
        .setTop('1px')
        .setLeft('6px');
    timePlayedButton.add(timePlayedImage);
    addToolTip(timePlayedButton, 'See Time Played')
    timePlayedButton.onClick(() => {
        Communication.interact(null, { type: 'time_played' });
    });

    var pvpAreaButton = new Button()
        .setPosition('absolute')
        .setLeft('422px')
        .setBackgroundColor('#cccccc')
        .setWidth('56px')
        .setColor('#555555')
        .setBorderRadius('10px')
        .setFontWeight('bold')
        .setBottom('52px')
        .setHeight('46px')
        .setOpacity('0.9');
    container.add(pvpAreaButton);
    var pvpAreaImage = new svgToImage(SVG['swords.svg'])
        .setWidth('40px')
        .setHeight('40px')
        .setPosition('absolute')
        .setTop('1px')
        .setLeft('6px');
    pvpAreaButton.add(pvpAreaImage);
    var pvpAreaText = new Text()
        .setTextContent('5')
        .setWidth('100%')
        .setTextAlign('center')
        .setFontSize('10px')
        .setPosition('absolute')
        .setTop('14px')
        .setLeft('0px')
    pvpAreaButton.add(pvpAreaText);
    addToolTip(pvpAreaButton, 'PvP Area');
    pvpAreaButton.onClick(() => {
        Communication.interact(null, { type: 'pvp_area' });
    });
    Signals.subscribe('segmentChange', function (obj) {
        var segX = obj.x;
        var segY = obj.y;
        var multiplier = Config.segmentToPVPMultiplier[segX + '-' + segY];
        if (!multiplier) {
            multiplier = 0;
        }
        pvpAreaText.setTextContent(multiplier * 100);
    });

    var collectionLogButton = new Button()
        .setPosition('absolute')
        .setLeft('362px')
        .setBackgroundColor('#cccccc')
        .setWidth('56px')
        .setColor('#555555')
        .setBorderRadius('10px')
        .setFontWeight('bold')
        .setBottom('52px')
        .setHeight('46px')
        .setOpacity('0.9');
    container.add(collectionLogButton);
    var collectionLogImage = new svgToImage(SVG['book.svg'])
        .setWidth('40px')
        .setHeight('40px')
        .setPosition('absolute')
        .setTop('1px')
        .setLeft('6px');
    collectionLogButton.add(collectionLogImage);
    addToolTip(collectionLogButton, 'Collection Log')
    collectionLogButton.onClick(() => {
        Communication.interact(null, { type: 'collection_log' });
    });

    var equipmentButton = new Button()
        .setPosition('absolute')
        .setLeft('302px')
        .setBackgroundColor('#cccccc')
        .setWidth('56px')
        .setColor('#555555')
        .setBorderRadius('10px')
        .setFontWeight('bold')
        .setBottom('52px')
        .setHeight('46px')
        .setOpacity('0.9');
    container.add(equipmentButton);
    var equipmentImage = new svgToImage(SVG['helmet.svg'])
        .setWidth('40px')
        .setHeight('40px')
        .setPosition('absolute')
        .setTop('1px')
        .setLeft('6px');
        equipmentButton.add(equipmentImage);
    addToolTip(equipmentButton, 'Equipment Info')
    equipmentButton.onClick(() => {
        EquipmentPanel.show();
    });

    musicButton = new Button()
        .setPosition('absolute')
        .setLeft('482px')
        .setBackgroundColor('#cccccc')
        .setWidth('30px')
        .setColor('#555555')
        .setBorderRadius('5px')
        .setFontWeight('bold')
        .setBottom('18px')
        .setHeight('30px')
        .setOpacity('0.9');
    container.add(musicButton);
    var musicImage = new svgToImage(SVG['music.svg'])
        .setWidth('25px')
        .setHeight('25px')
        .setPosition('absolute')
        .setTop('0px')
        .setLeft('0px');
    musicButton.add(musicImage);
    musicTooltipText = addToolTip(musicButton, 'Play Music')
    musicButton.onClick(() => {
        musicButton.isActive = !musicButton.isActive;
        if (musicButton.isActive ) {
            musicTooltipText.setTextContent('Stop Music')
            musicButton.setBackgroundColor('#aaaaaa')
            Communication.interact(null, { type: 'toggle_music', interaction: 1 });
        } else {
            musicTooltipText.setTextContent('Play Music')
            musicButton.setBackgroundColor('#cccccc')
            Communication.interact(null, { type: 'toggle_music', interaction: 0 });
            stopMusic();
        }
    });
    soundEffectsButton = new Button()
        .setPosition('absolute')
        .setLeft('512px')
        .setBackgroundColor('#cccccc')
        .setWidth('30px')
        .setColor('#555555')
        .setBorderRadius('5px')
        .setFontWeight('bold')
        .setBottom('18px')
        .setHeight('30px')
        .setOpacity('0.9');
    container.add(soundEffectsButton);
    var soundEffectsImage = new svgToImage(SVG['sound_effects.svg'])
        .setWidth('25px')
        .setHeight('25px')
        .setPosition('absolute')
        .setTop('0px')
        .setLeft('0px');
    soundEffectsButton.add(soundEffectsImage);
    soundEffectsTooltipText = addToolTip(soundEffectsButton, 'Enable Sound Effects')
    soundEffectsButton.onClick(() => {
        soundEffectsButton.isActive = !soundEffectsButton.isActive;
        if (soundEffectsButton.isActive ) {
            soundEffectsTooltipText.setTextContent('Disable Sound Effects')
            soundEffectsButton.setBackgroundColor('#aaaaaa')
            Communication.interact(null, { type: 'toggle_sfx', interaction: 1 });
        } else {
            soundEffectsTooltipText.setTextContent('Enable Sound Effects')
            soundEffectsButton.setBackgroundColor('#cccccc')
            Communication.interact(null, { type: 'toggle_sfx', interaction: 0 });
            disableSoundEffects();
        }
    });
    var range = new Input('range')
        .setPosition('absolute')
        .setLeft('482px')
        .setBackgroundColor('#cccccc')
        .setWidth('56px')
        .setColor('#555555')
        .setBorderRadius('5px')
        .setFontWeight('bold')
        .setBottom('0px')
        .setHeight('14px')
        .setOpacity('0.9');
    range.dom.style.appearance = 'none';
    container.add(range);
    range.onInput(() => {
        var value = range.dom.value;
        setVolume(value);
    })

    Signals.subscribe('disconnect', function () {
        musicButton.isActive = false;
        musicTooltipText.setTextContent('Play Music')
        musicButton.setBackgroundColor('#cccccc')

        soundEffectsButton.isActive = false;
        soundEffectsTooltipText.setTextContent('Enable Sound Effects')
        soundEffectsButton.setBackgroundColor('#cccccc')

        stopMusic();
        disableSoundEffects();
    })

    chatButton = new Button()
        .setPosition('absolute')
        .setLeft('422px')
        .setBackgroundColor('#cccccc')
        .setWidth('56px')
        .setColor('#555555')
        .setBorderRadius('10px')
        .setFontWeight('bold')
        .setBottom('2px')
        .setHeight('46px')
        .setOpacity('0.9');
    container.add(chatButton);
    var chatImage = new svgToImage(SVG['chat-dark.svg'])
        .setWidth('40px')
        .setHeight('40px')
        .setPosition('absolute')
        .setTop('1px')
        .setLeft('6px');
    chatButton.add(chatImage);
    chatTooltipText = addToolTip(chatButton, 'Disable Chat')
    chatButton.onClick(() => {
        chatButton.isActive = !chatButton.isActive;
        if (chatButton.isActive ) {
            chatTooltipText.setTextContent('Disable Chat')
            chatButton.setBackgroundColor('#aaaaaa')
            Communication.interact(null, { type: 'toggle_chat', interaction: 1 });
        } else {
            chatTooltipText.setTextContent('Enable Chat')
            chatButton.setBackgroundColor('#cccccc')
            Communication.interact(null, { type: 'toggle_chat', interaction: 0 });
        }
    });

    var settingsButton = new Button()
        .setPosition('absolute')
        .setLeft('362px')
        .setBackgroundColor('#cccccc')
        .setWidth('56px')
        .setColor('#555555')
        .setBorderRadius('10px')
        .setFontWeight('bold')
        .setBottom('2px')
        .setHeight('46px')
        .setOpacity('0.9');
    container.add(settingsButton);
    var settingsImage = new svgToImage(SVG['settings.svg'])
        .setWidth('40px')
        .setHeight('40px')
        .setPosition('absolute')
        .setTop('1px')
        .setLeft('6px');
        settingsButton.add(settingsImage);

    addToolTip(settingsButton, 'Settings');
    function handleSettingsClick() {
        SettingsPanel.show();
    }
    settingsButton.onClick(handleSettingsClick);

    membershipButton = new Button()
        .setPosition('absolute')
        .setLeft('302px')
        .setBackgroundColor('#cccccc')
        .setWidth('56px')
        .setColor('#555555')
        .setBorderRadius('10px')
        .setFontWeight('bold')
        .setBottom('2px')
        .setHeight('46px')
        .setOpacity('0.9');
    container.add(membershipButton);

    var questThumbnail = new Panel()
        .setWidth('60px')
        .setHeight('50px')
        .setLeft('240px')
        .setTop('100px')
        .setPosition('absolute')
        .setCursor('pointer')
    var questImage = svgToImage(SVG['quests.svg'])
        .setWidth('42px')
        .setHeight('42px')
        .setPosition('absolute')
        .setTop('4px');
    questThumbnail.add(questImage);
    var completedQuests = new Text()
        .setTextContent('1')
        .setColor('#555555')
        .setFontWeight('bold')
        .setPosition('absolute')
        .setTop('9px')
        .setRight('2px')
        .setFontSize('12px')
        .setBackgroundColor('#cccccc')
        .setBorderRadius('2px')
        .setBorderBottom('2px solid #555555')
        questThumbnail.add(completedQuests);
    var totalQuests = new Text()
        .setTextContent('1')
        .setColor('#555555')
        .setFontWeight('bold')
        .setPosition('absolute')
        .setBottom('9px')
        .setRight('2px')
        .setFontSize('12px')
        .setBackgroundColor('#cccccc')
        .setBorderRadius('2px')
        .setBorderTop('2px solid #555555')
    questThumbnail.add(totalQuests);
    questThumbnail.onClick(() => {
        if (QuestsPanel.dom.style.display == 'block') {
            QuestsPanel.hide();
        } else {
            QuestsPanel.show();
        }
    })

    var questPanel = new Panel()
        .setPosition('absolute')
        .setDisplay('none')
        .setOpacity(0.85)
        .setBorder('1px solid black')
        .setPadding('5px')
        .setBorderRadius('3px')
        .setBackgroundColor('#ffffff')
        .setTextContent('Quests')
    questThumbnail.add(questPanel);

    ((questPanel, questThumbnail) => {
        var timer;
        questThumbnail.onMouseEnter(function () {
            timer = setTimeout(() => {
                questPanel.setDisplay('block')
            }, 400)
        })
        questThumbnail.onMouseLeave(function (event) {
            questPanel.setDisplay('none');
            clearTimeout(timer);
        })
    })(questPanel, questThumbnail);

    skills['quests'] = {
        completedQuests: completedQuests,
        totalQuests: totalQuests,
    }

    container.add(questThumbnail);

    for (var i = skillList.length - 1; i >= 0; i--) {
        var name = skillList[i];
        var thumbnail = new Panel()
            .setWidth('60px')
            .setHeight('50px')
            .setLeft((i % 5) * 60 + 'px')
            .setTop(Math.floor(i / 5) * 50 + 'px')
            .setPosition('absolute')
        var image = svgToImage(SVG[name + '.svg'])
            .setWidth('42px')
            .setHeight('42px')
            .setPosition('absolute')
            .setTop('4px');
        thumbnail.add(image);
        var currentLevel = new Text()
            .setTextContent('1')
            .setColor('#555555')
            .setFontWeight('bold')
            .setPosition('absolute')
            .setTop('9px')
            .setRight('2px')
            .setFontSize('12px')
            .setBackgroundColor('#cccccc')
            .setBorderRadius('2px')
            .setBorderBottom('2px solid #555555')
        thumbnail.add(currentLevel);
        var baseLevel = new Text()
            .setTextContent('1')
            .setColor('#555555')
            .setFontWeight('bold')
            .setPosition('absolute')
            .setBottom('9px')
            .setRight('2px')
            .setFontSize('12px')
            .setBackgroundColor('#cccccc')
            .setBorderRadius('2px')
            .setBorderTop('2px solid #555555')
        thumbnail.add(baseLevel);

        var experiencePanel = new Panel()
            .setPosition('absolute')
            .setDisplay('none')
            .setOpacity(0.85)
            .setBorder('1px solid black')
            .setPadding('5px')
            .setBorderRadius('3px')
            .setBackgroundColor('#ffffff')
        var skillName = new Text()
            .setTextContent(capitalizeFirstLetter(name))
            .setDisplay('block');
        experiencePanel.add(skillName);
        var currentExperience = new Text()
            .setTextContent('Current xp: ')
            .setDisplay('block')
            .setWhiteSpace('nowrap');
        experiencePanel.add(currentExperience);
        var remainingExperience = new Text()
            .setTextContent('Remaining: 200')
            .setDisplay('block')
            .setWhiteSpace('nowrap');
        experiencePanel.add(remainingExperience);
        thumbnail.add(experiencePanel);

        ((experiencePanel, thumbnail) => {
            var timer;
            thumbnail.onMouseEnter(function () {
                timer = setTimeout(() => {
                    experiencePanel.setDisplay('block')
                }, 400)
            })
            thumbnail.onMouseLeave(function (event) {
                experiencePanel.setDisplay('none');
                clearTimeout(timer);
            })
        })(experiencePanel, thumbnail);

        skills[name] = {
            panel: thumbnail,
            currentLevel: currentLevel,
            baseLevel: baseLevel,
            currentExperience: currentExperience,
            remainingExperience: remainingExperience
        }
        container.add(thumbnail);
    }
});

container.onDragOver(x => x.preventDefault());

function updateRemainingTime(seconds) {
    seconds = Math.max(seconds, 0);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var remainingMinutes = minutes % 60;
    var remainingSeconds = seconds % 60;

    // Add leading zeros for single-digit values
    var formattedMinutes = remainingMinutes.toString().padStart(2, "0");
    var formattedSeconds = remainingSeconds.toString().padStart(2, "0");

    remainingText.setTextContent(formattedMinutes + ':' + formattedSeconds);
    if (hours >= 1 && remainingText.getDisplay() == 'inline-block' ) {
        remainingText.setDisplay('none')
        logoutText.setTop('13px')
    } else if(hours < 1 && remainingText.getDisplay() == 'none') {
        remainingText.setDisplay('inline-block')
        logoutText.setTop('6px')
    }
    
}

var remainingTicks = 0;
function updateRemainingTicks() {
    var accurateSeconds = remainingTicks * .5;
    var seconds = Math.floor(accurateSeconds);
    updateRemainingTime(seconds);

    var diff = accurateSeconds - seconds;
    if (diff < 0.5) {
        setTimeout(() => {
            updateRemainingTime(seconds - 1);
        }, (diff) * 1000)
    }
}

function updateQuests(object, state) {
    var info = skills['quests'];
    var quests = Config.questList;

    var totalQuests = 0;
    var completedQuests = 0;

    QuestsPanel.mainPanel.dom.innerHTML = '';

    for (var key in quests) {
        if (state[key] !== undefined) {
            object.userData.state[key] = state[key];
        }

        var text = new Text()
            .setTextContent(quests[key][0])
            .setDisplay('block');

        totalQuests += 1;
        if (quests[key][1].indexOf(object.userData.state[key]) != -1) {
            completedQuests += 1;
            text.setColor('#27ae60');

            window.parent.postMessage(JSON.stringify({
                type: 'achievement',
                achievement: quests[key][0].toUpperCase().split(' ').join('_')
            }), '*');
            

        } else if (object.userData.state[key] !== 0) {
            text.setColor('#f39c12');
        } else {
            text.setColor('#c0392b');
        }
        QuestsPanel.mainPanel.add(text);

    }
    info.completedQuests.setTextContent(completedQuests);
    info.totalQuests.setTextContent(totalQuests);

}

container.handleChange = function (object, state) {
    if (object.userData.uuid != getCharacterId()) return;

    if (object.userData.uuid == getCharacterId()) {
        if (state.sa == 12) { // death animation
            Signals.publish("characterDeath")
        }
    }

    var experienceChanges = [];
    for (var i = 0; i < skillList.length; i++) {
        var name = skillList[i];
        var keys = Config.skillToFieldMap[name];

        if (keys.length == 1 && state[keys[0]]) {
            skills[name].currentExperience.setDisplay('none');
            skills[name].remainingExperience.setDisplay('none');
            skills[name].baseLevel.setDisplay('none');
            skills[name].currentLevel.setBorder('');
            skills[name].currentLevel.setTop('');
            skills[name].currentLevel.setBottom('2px');
            skills[name].currentLevel.setTextContent(state[keys[0]]);
            continue;
        };

        var baseField = keys[1];
        if (state[baseField] !== undefined) {
            skills[name].baseLevel.setTextContent(state[baseField]);
            object.userData.state[baseField] = state[baseField];

        }
        var currentField = keys[2];
        if (state[currentField] !== undefined) {
            skills[name].currentLevel.setTextContent(state[currentField]);
            object.userData.state[currentField] = state[currentField];
        }

        var experienceField = keys[0];
        if (state[experienceField] !== undefined) {
            var oldXp = extractFirstInt(skills[name].currentExperience.getTextContent());
            skills[name].currentExperience.setTextContent('Current xp: ' + state[experienceField]);
            object.userData.state[experienceField] = state[experienceField];
            var newXp = extractFirstInt(skills[name].currentExperience.getTextContent());
            if (!isNaN(oldXp)) {
                var diff = newXp - oldXp;
                experienceChanges.push([diff, name]);
            }

            var experienceAtNextLevel = Config.levelToXpMap[object.userData.state[baseField] + 1];
            var experienceToNextLevel = experienceAtNextLevel - state[experienceField];
            skills[name].remainingExperience.setTextContent('Remaining: ' + experienceToNextLevel);
            if (object.userData.state[baseField] == 99) {
                skills[name].remainingExperience.setTextContent('');
            }
        }
    }
    handleExperienceChange(experienceChanges);
    updateQuests(object, state);
    if (state.tr) {
        remainingTicks = state.tr;
        updateRemainingTicks();
    }
    if (state.chat !== undefined) {
        if (state.chat == 1) {
            chatButton.isActive = true;
            chatTooltipText.setTextContent('Disable Chat')
            chatButton.setBackgroundColor('#aaaaaa')
        } else {
            chatButton.isActive = false;
            chatTooltipText.setTextContent('Enable Chat')
            chatButton.setBackgroundColor('#cccccc')
        }
        object.userData.state.chat = state.chat;
    }

    if (state.music !== undefined) {
        if (state.music == 1) {
            musicButton.isActive = true;
            musicTooltipText.setTextContent('Stop Music')
            musicButton.setBackgroundColor('#aaaaaa')    
            playMusic();
        } else {
            musicButton.isActive = false;
            musicTooltipText.setTextContent('Play Music')
            musicButton.setBackgroundColor('#cccccc')
            stopMusic();
        }
        object.userData.state.music = state.music;
    }
    if (state.sfx !== undefined) {
        if (state.sfx == 1) {
            soundEffectsButton.isActive = true;
            soundEffectsTooltipText.setTextContent('Disable Sound Effects')
            soundEffectsButton.setBackgroundColor('#aaaaaa')
            enableSoundEffects();
        } else {
            soundEffectsButton.isActive = false;
            soundEffectsTooltipText.setTextContent('Enable Sound Effects')
            soundEffectsButton.setBackgroundColor('#cccccc')
            disableSoundEffects();
        }
        object.userData.state.sfx = state.sfx;
    }
}

Signals.subscribe('serverUpdate', function () {
    remainingTicks -= 1;
    updateRemainingTicks();
})

Signals.subscribe('windowResize', container.onResize);
Signals.subscribe('beginRendering', container.onResize);