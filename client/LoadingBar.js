import * as Signals from './Signals.js';
import { Panel } from './UI.js';

var backgroundColor = '#10334a';
var foregroundColor = '#194d6f';

const LoadingBar = new Panel();
export default LoadingBar;
LoadingBar.setClass('LoadingBar')
    .setWidth('100%')
    .setBackgroundColor(backgroundColor);

var progressContainer = new Panel()
    .setWidth('300px')
    .setHeight('20px')
    .setMargin('0 auto')
    .setBackgroundColor(backgroundColor)
    .setPosition('relative')
    .setBorderRadius('10px')
    .setBorder('2px solid ' + foregroundColor)
LoadingBar.add(progressContainer);

var progress = new Panel()
    .setHeight('12px')
    .setTop('4px')
    .setLeft('4px')
    .setPosition('relative')
    .setBackgroundColor(foregroundColor)
    .setBorderRadius('6px');
progressContainer.add(progress);

function onResize() {
    var height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight);
    LoadingBar.setHeight(height + 'px');
    progressContainer.setTop((height / 2 - 10) + 'px');
}
Signals.subscribe('windowResize', onResize);
onResize();

Signals.subscribe('assetsLoading', function (value) {
    progress.setWidth(Math.round(value * 292) + 'px');
});
Signals.subscribe('loadingSceneLoaded', function (value) {
    LoadingBar.setDisplay('none');
});

export function webglNotSupported() {
    var webGLNotSupported = new Panel()
        .setTextContent('WebGL is not supported by your browser.')
        .setColor('white')
        .setTextAlign('center');
    progressContainer.add(webGLNotSupported);
    progressContainer
        .setHeight('')
        .setBorder('')
    progress.setDisplay('none');
}
