import { AmbientLight, Color, Fog, PerspectiveCamera, DirectionalLight, WebGLRenderer, PCFSoftShadowMap, PMREMGenerator, Scene } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export var MainScene = new Scene();
MainScene.background = new Color(0x3498db);
MainScene.fog = new Fog(0x3498db, 64, 96);

export var Camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 200);
Camera.position.setX(20).setY(20).setZ(20);

var ambientLight = new AmbientLight(0x999999, Math.PI);
export var DirectedLight = new DirectionalLight(0x999999, Math.PI/2);
DirectedLight.position.z = 25;
DirectedLight.position.x = 5;
DirectedLight.position.y = 50;
let d = 100;
let mapSize = 4096;
DirectedLight.castShadow = true;
DirectedLight.shadow.intensity = 0.5;
DirectedLight.shadow.mapSize.width = mapSize;
DirectedLight.shadow.mapSize.height = mapSize;
DirectedLight.shadow.camera.top = DirectedLight.shadow.camera.right = d;
DirectedLight.shadow.camera.bottom = DirectedLight.shadow.camera.left = -d;
DirectedLight.shadow.camera.near = 1;
DirectedLight.shadow.camera.far = 4000;

MainScene.add(ambientLight);
MainScene.add(DirectedLight);

function getEnvironment(renderer) {
    var pmremGenerator = new PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    return pmremGenerator.fromScene(new RoomEnvironment()).texture;
}

var pixelRatio = window.devicePixelRatio;

export var Renderer = new WebGLRenderer({ alpha: true });
Renderer.setPixelRatio(pixelRatio);
Renderer.shadowMap.enabled = true;
Renderer.shadowMap.type = PCFSoftShadowMap; 
export var Environment = getEnvironment(Renderer);

export var InventoryRenderer = new WebGLRenderer({ alpha: true, preserveDrawingBuffer: true });
InventoryRenderer.setPixelRatio(1);
InventoryRenderer.setSize(100, 100);
export var InventoryEnvironment = getEnvironment(InventoryRenderer);

export var ChatRenderer = new WebGLRenderer({ alpha: true });
ChatRenderer.setPixelRatio(pixelRatio);
ChatRenderer.setSize(150, 150);
export var ChatEnvironment = getEnvironment(ChatRenderer);

export var LoginScreenRenderer = new WebGLRenderer({ alpha: true, antialias: true });
LoginScreenRenderer.setPixelRatio(pixelRatio);
LoginScreenRenderer.shadowMap.enabled = true;
LoginScreenRenderer.shadowMap.type = PCFSoftShadowMap; 
export var LoginScreenEnvironment = getEnvironment(LoginScreenRenderer);

export function updatePixelRatio(ratio) {
    Renderer.setPixelRatio(ratio);
    ChatRenderer.setPixelRatio(ratio);
    LoginScreenRenderer.setPixelRatio(ratio);
}