import { NodeIO } from '@gltf-transform/core';

import AssetLibraryPath from './AssetLibraryPath.js';

const io = new NodeIO();
var path = AssetLibraryPath + 'environment/environment.glb';
const environment = await io.read(path);

export default environment;