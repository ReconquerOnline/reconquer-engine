import { Button, Panel, Text } from './UI.js';
import Viewport from './Viewport.js';
import * as Signals from './Signals.js';
import Inventory from './Inventory.js';
import Chat from './Chat.js';
import Info from './Info.js';
import { getCharacter, SVG } from './Loader.js';
import { svgToImage, addToolTip } from './Utils.js';

const container = new Panel()
export default container;
container.setClass('ExperiencePanel');
container.setPosition('absolute')
container.setTop('30px');
container.setDisplay('none');

Signals.subscribe('beginRendering', function () {
    container.setDisplay('block');
});

Signals.subscribe('disconnect', function (message) {
    container.setDisplay('none');
});

var onResize = function () {
    var width = Viewport.dom.offsetWidth;
    var left = (width - container.dom.offsetWidth) / 2;
    container.setLeft(left + 'px');
}


function createPanel(amount, skill) {
    var panel = new Panel()
        .setDisplay('flex')
        .setFloat('left')
        .setMarginRight('10px')
    var text = new Text()
        .setTextContent(amount)
        .setFontSize('20px')
        .setColor('white')
    panel.add(text);
    panel.add(svgToImage(SVG[skill + '.svg'])
        .setWidth('24px')
        .setHeight('24px')
        .setDisplay('inline-block')
        .setMarginLeft('2px')
    )
    return panel
}

function fade(element, start, end, callback) {
    element.style.opacity = start;
    element.style.transition = `opacity 200ms ease-in-out`;
    setTimeout(() => {
      element.style.opacity = end;
    }, 0);
      element.addEventListener('transitionend', function(event) {
          element.style.transition = ''; 
          if (callback) {
            callback();
          }
      }, {once: true});
}

export function handleExperienceChange(experienceChanges) {
    if (experienceChanges.length == 0) return;
    if (getCharacter().userData.state.hxp) return;
    container.clear();
    container.dom.style.opacity = 0;
    for (var experience of experienceChanges) {
        container.add(createPanel(experience[0], experience[1]));
    }
    onResize();
    fade(container.dom, 0, 1, function () {
        setTimeout(function () {
            fade(container.dom, 1, 0);
        }, 800)
    })
}

Signals.subscribe('windowResize', onResize);