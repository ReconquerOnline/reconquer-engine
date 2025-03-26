import { Button, Input, Panel, Select } from './UI.js';
import * as Signals from './Signals.js';
import Viewport, { disableLeftClickRotate, updateRenderState } from './Viewport.js';
import { getCharacterId } from './Loader.js';
import * as Communication from './Communication.js';
import { loadModFile } from './ModFramework.js';

const container = new Panel()
export default container;
container.setClass('SettingsPanel');

container.setWidth('250px')
    .setHeight('250px')
    .setPosition('absolute')
    .setBorderRadius('5px')
container.show = function () {
    Signals.publish('optionalDialogueShow')
    container.onResize();
    container.setDisplay('block');
}
container.hide = function () {
    container.setDisplay('none');
}
container.hide();
container.onResize = function () {
    var width = Viewport.dom.offsetWidth;
    var left = (width - 250) / 2;
    container.setLeft(left + 'px');

    var height = Viewport.dom.offsetHeight;
    var bottom = (height - 125) / 2;
    container.setBottom(bottom + 'px');
}

var headerPanel = new Panel()
    .setWidth('248px')
    .setHeight('18px')
    .setBackgroundColor('white')
    .setOpacity(.7)
    .setBorder('1px solid #cccccc');
container.add(headerPanel)

var titlePanel = new Panel()
    .setHeight('18px')
    .setWidth('230px')
    .setPosition('absolute')
    .setTop('0px')
    .setLeft('0px')
    .setTextAlign('center')
titlePanel.setTextContent('Settings');
headerPanel.add(titlePanel);

var closePanel = new Panel()
    .setHeight('18px')
    .setWidth('18px')
    .setPosition('absolute')
    .setTop('0px')
    .setRight('0px')
    .setTextContent('\u00d7')
    .setCursor('pointer');
headerPanel.add(closePanel)
closePanel.onClick(container.hide);

var scrollPanel = new Panel()
    .setWidth('248px')
    .setHeight('250px')
    .setBackgroundColor('white')
    .setOpacity(.7)
    .setBorder('1px solid #cccccc')
    .setOverflowY('auto');
container.add(scrollPanel);
var mainPanel = new Panel()
    .setWidth('225px')
    .setPadding('10px');
scrollPanel.add(mainPanel);

var graphicsText = new Panel()
    .setTextContent('Graphics Quality:')
    .setFontSize('14px')
    mainPanel.add(graphicsText);
var graphicsSelect = new Select([
    'Standard Definition',
    'SD with shadows',
    'SD with shadows and bloom',
    'High Definition',
    'HD with shadows',
    'HD with shadows and bloom'
])
    .setWidth('100%')
    .setMarginBottom('5px')
graphicsSelect.onChange(() => {
    updateRenderState(Number(graphicsSelect.getValue()) + 1);
    Communication.interact(null, { type: 'toggle_graphics', interaction: Number(graphicsSelect.getValue()) + 1 });
})
mainPanel.add(graphicsSelect)

var leftClickRotateText = new Panel()
    .setTextContent('Left Click Rotate:')
    .setFontSize('14px')
mainPanel.add(leftClickRotateText);
var leftClickRotateSelect = new Select([
    'Enabled',
    'Disabled'
])
    .setWidth('100%')
    .setMarginBottom('5px')
leftClickRotateSelect.onChange(() => {
    Communication.interact(null, { type: 'toggle_dlcr', interaction: Number(leftClickRotateSelect.getValue()) });
    var value = leftClickRotateSelect.getValue() == 0 ? false : true;
    disableLeftClickRotate(value);
})
mainPanel.add(leftClickRotateSelect)

var showRoofsText = new Panel()
    .setTextContent('Show Roofs:')
    .setFontSize('14px')
mainPanel.add(showRoofsText);
var showRoofsSelect = new Select([
    'Enabled',
    'Disabled'
])
    .setWidth('100%')
    .setMarginBottom('5px')
showRoofsSelect.onChange(() => {
    Communication.interact(null, { type: 'toggle_hroof', interaction: Number(showRoofsSelect.getValue()) });
})
mainPanel.add(showRoofsSelect)

var showExperienceText = new Panel()
    .setTextContent('Show Experience Drops:')
    .setFontSize('14px')
mainPanel.add(showExperienceText);
var showExperienceSelect = new Select([
    'Enabled',
    'Disabled'
])
    .setWidth('100%')
    .setMarginBottom('5px')
    showExperienceSelect.onChange(() => {
    Communication.interact(null, { type: 'toggle_hxp', interaction: Number(showExperienceSelect.getValue()) });
})
mainPanel.add(showExperienceSelect)


var loadModsText = new Panel()
    .setTextContent('Load Mod File [Experimental]:')
    .setFontSize('14px')
mainPanel.add(loadModsText);

var fileInput = new Input('file');
fileInput.dom.accept = ".zip";
fileInput.onChange((event) => {
    var files = event.target.files;
    if (files && files.length > 0) {
        var file = files[0]; // Get the first selected file
        loadModFile(file);
    }
});
mainPanel.add(fileInput);


container.handleChange = function (object, state) {
    if (object.userData.uuid != getCharacterId()) return;
    if (state.dlcr !== undefined) {
        leftClickRotateSelect.dom.value = state.dlcr;
        disableLeftClickRotate(state.dlcr);
    }
    if (state.graphics !== undefined) {
        graphicsSelect.dom.value = state.graphics - 1;
        updateRenderState(Number(state.graphics));
    }
    if (state.hroof !== undefined) {
        object.userData.state.hroof = state.hroof;
        showRoofsSelect.dom.value = state.hroof;
    }
    if (state.hxp !== undefined) {
        object.userData.state.hxp = state.hxp;
        showExperienceSelect.dom.value = state.hxp;
    }
}



Signals.subscribe('disconnect', function (message) {
    container.setDisplay('none');
});
Signals.subscribe('windowResize', container.onResize);
Signals.subscribe('beginRendering', container.onResize);
Signals.subscribe('optionalDialogueShow', function () {
    container.hide();
})