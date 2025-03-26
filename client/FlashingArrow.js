import { Panel } from './UI.js';
import Viewport from './Viewport.js';
import * as Signals from './Signals.js';
const container = new Panel()

container.setClass('FlashingArrow');

container
    .setPosition('absolute');
var locFn = function () { return [0,0] }
container.show = function (locationFn) {
    locFn = locationFn;
    container.onResize();
    container.setDisplay('block');
    flashArrow();
}
container.hide = function () {
    container.setDisplay('none');
}
container.hide();
container.onResize = function () {
    var width = Viewport.dom.offsetWidth;
    var height = Viewport.dom.offsetHeight;
    var arr = locFn(width, height)
    container.setLeft(arr[0] + 'px');
    container.setTop(arr[1] + 'px');
}

container
    .setTextContent('\u2193')
    .setPosition('fixed')
    .setLeft('0px')
    .setTop('0px')
    .setFontSize('75px')
    .setFontWeight('bold')
    .setColor('#f1c40f');
function flashArrow() {
    if (container.dom.style.display == 'none') return;

    container.setOpacity(0.75 + Math.sin(Date.now() / 150) / 4);
    requestAnimationFrame(flashArrow)
}
requestAnimationFrame(flashArrow)

Signals.subscribe('windowResize', container.onResize);

export default container;