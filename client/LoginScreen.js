import * as Signals from './Signals.js';
import * as Communication from './Communication.js';
import { Button, Input, Panel, Text, Link } from './UI.js';
import { LoginScreenRenderer } from './Editor.js';
import * as Loader from './Loader.js';
import { AmbientLight, Color, DirectionalLight, Fog, PerspectiveCamera, Scene } from 'three';

var backgroundColor = '#10334a';
var foregroundColor = '#194d6f';
var fontColor = '#ecf0f1';
var errorColor = '#e74c3c';

var LoginScreen = new Panel();
export default LoginScreen;
LoginScreen.setClass('LoginScreen')
    .setWidth('100%')
    .setBackgroundColor(backgroundColor)
    .setDisplay('none');

var scene = new Scene();
var skyMesh;
scene.background = new Color(0x3498db);
scene.fog = new Fog(0x3498db, 64, 128);
var camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 200);
camera.position.setX(-40).setY(20).setZ(70);
var ambientLight = new AmbientLight(0xffffff);
var directionalLight = new DirectionalLight(0xffffff, 0.5);
directionalLight.position.z = 25;
directionalLight.position.x = 5;
directionalLight.position.y = 50;
let d = 100;
let mapSize = 4096;
directionalLight.castShadow = true;
directionalLight.shadow.intensity = 0.5;
directionalLight.shadow.mapSize.width = mapSize;
directionalLight.shadow.mapSize.height = mapSize;
directionalLight.shadow.camera.top = directionalLight.shadow.camera.right = d;
directionalLight.shadow.camera.bottom = directionalLight.shadow.camera.left = -d;
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 4000;
scene.add(ambientLight);
scene.add(directionalLight);

LoginScreenRenderer.domElement.style.position = 'absolute';
LoginScreenRenderer.domElement.style.display = 'inline';
LoginScreen.dom.appendChild(LoginScreenRenderer.domElement);

var mainPanel = new Panel()
    .setWidth('300px')
    .setMargin('0 auto')
    .setBackgroundColor(foregroundColor)
    .setPosition('relative')
    .setPadding('10px')
    .setBorderRadius('10px');
LoginScreen.add(mainPanel);

var welcomePanel = new Panel()
    .setWidth('100%');
mainPanel.add(welcomePanel);

var welcomeText = new Panel()
    .setTextContent('Welcome to Reconquer!')
    .setColor(fontColor)
    .setWidth('300px')
    .setTextAlign('center')
    .setMarginBottom('10px');
welcomePanel.add(welcomeText);

var playWithoutSavingButton = new Button()
    .setTextContent('Play now!')
    .setBorderRadius('5px')
    .setColor(fontColor)
    .setHeight('40px')
    .setWidth('300px')
    .setBackgroundColor(foregroundColor)
    .setMarginBottom('10px')
    .setFontWeight('bold');
welcomePanel.add(playWithoutSavingButton)

var accounts = JSON.parse(localStorage.getItem('ids')) ?? [];
if (accounts[0]) {
    var displayName = localStorage.getItem('dn_' + accounts[0]) ?? 'Account';
    playWithoutSavingButton.setTextContent(displayName);
}


var welcomeErrorText = new Panel()
    .setTextContent('Too many connections')
    .setColor(errorColor)
    .setFontSize('14px')
    .setMarginBottom('10px')
    .setWidth('100%')
    .setTextAlign('center');

welcomePanel.add(welcomeErrorText);

playWithoutSavingButton.onClick(() => {
    var uuid = null;
    var otp = null;

    if (localStorage.getItem('ids')) {
        var ids = JSON.parse(localStorage.getItem('ids'));
        uuid = ids[0];
        otp = ids[1];
    }

    Communication.login(uuid, otp);
    playWithoutSavingButton.setDisabled(true);
    playWithoutSavingButton.setCursor('wait');
});

function showWelcomePanel() {
    welcomePanel.setDisplay('block');

    welcomeErrorText.setDisplay('none');
    playWithoutSavingButton.setDisabled(false);
    playWithoutSavingButton.setCursor('pointer');
    onResize();
}
showWelcomePanel();

Signals.subscribe('handleLogin', function (msg) {
    if (msg.e) {
        welcomeErrorText.setDisplay('block');
        welcomeErrorText.setTextContent(msg.e);

        loginIncorrectCode.setDisplay('block');
        loginIncorrectCode.setTextContent(msg.e);

        loginEmailErrorText.setDisplay('block');
        loginEmailErrorText.setTextContent(msg.e);

        playWithoutSavingButton.setDisabled(false);
        playWithoutSavingButton.setCursor('pointer');
        loginSubmitButton.setDisabled(false);
        loginSubmitButton.setCursor('pointer');
    }
});

function onResize() {
    var width = window.innerWidth;
    var height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight);
    LoginScreen.setHeight(height + 'px');
    var panelHeight = mainPanel.getBounds().height;
    mainPanel.setTop((height - panelHeight) / 2 + 'px');

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    LoginScreenRenderer.setSize(width, height);
}
Signals.subscribe('windowResize', onResize);
onResize();

var cancel = true;
var startTime;
function render() {
    if (!cancel) {
        var time = Date.now();
        var delta = time - startTime;
        camera.position.z = 50 - 20 * Math.sin(delta / 40000);
        skyMesh.position.copy(camera.position);
        skyMesh.position.y = 0;
        LoginScreenRenderer.render(scene, camera);
    }
    requestAnimationFrame(render);
}
render();

Signals.subscribe('assetsLoaded', function () {
    startTime = Date.now();
    var diffs = [];
    for (var name in Loader.Segments) {
        var segment = Loader.getAssetById(name);
        scene.add(segment);
        segment.traverse((child) => {
            child.receiveShadow = true;
        })
        Loader.Config.hierarchy[name].forEach((object) => {
            diffs.push({ 't': 'a', 'o': object, 'i': object.i, 'f': 1, scene: scene })
        });
    }

    skyMesh = Loader.getAssetById('sky');
    skyMesh.renderOrder = -999;
    skyMesh.material.depthWrite = false;
    skyMesh.material.depthTest = false;
    skyMesh.scale.multiplyScalar(1.6);
    scene.add(skyMesh);

    Signals.publish('update', { d: diffs });
    setTimeout(() => {
        scene.traverse((child) => {
            if (child.material) {
                child.material = Loader.LoginScreenMaterials[child.material.name];
            }
        })
        cancel = false;
        LoginScreen.setDisplay('block');
        Signals.publish('loadingSceneLoaded');
        onResize();
    }, 0);
});

Signals.subscribe('beginRendering', function () {
    setTimeout(() => {
        LoginScreen.setDisplay('none');
        cancel = true;
    }, 0);
});

Signals.subscribe('disconnect', function (message) {
    LoginScreen.setDisplay('block');
    cancel = false;
    showWelcomePanel();
    if (message) {
        welcomeErrorText.setTextContent(message);
        welcomeErrorText.setDisplay('block');
    }
});