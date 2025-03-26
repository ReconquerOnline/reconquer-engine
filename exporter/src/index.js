import { AssetsMap, ConfigFiles } from './LibraryAssets.js';
import ValidateAssets from './ValidateAssets.js';
import ValidateEnvironment from './ValidateEnvironment.js';
import GenerateCollisionMaps from './GenerateCollisionMaps.js';
import GenerateSceneHierarchy from './GenerateSceneHierarchy.js';
import ValidateMaterials from './ValidateMaterials.js';
import EnvironmentAsset from './EnvironmentAsset.js';
import StripCollisionObjects from './StripCollisionObjects.js';
import StripExtraMeshes from './StripExtraMeshes.js';
import ValidateReferencedMeshes from './ValidateReferencedMeshes.js';
import ValidateReferencedAnimations from './ValidateReferencedAnimations.js';
import StripEnvironment from './StripEnvironment.js';
import ExportGLB from './ExportGLB.js';
import ExportConfig from './ExportConfig.js';
import CombineSVG from './CombineSVG.js';
import CombineMusic from './CombineMusic.js';
import StripSVGTextures from './StripSVGTextures.js';
import combineSoundEffects from './CombineSoundEffects.js';

var svgs = CombineSVG();
CombineMusic();
combineSoundEffects();

ValidateAssets(AssetsMap);
ValidateEnvironment(EnvironmentAsset, AssetsMap, ConfigFiles);
var configHierarchy = GenerateSceneHierarchy(EnvironmentAsset, AssetsMap, ConfigFiles);
var collisionMaps = GenerateCollisionMaps(EnvironmentAsset, ConfigFiles);
StripEnvironment(EnvironmentAsset);
StripCollisionObjects(AssetsMap);
StripExtraMeshes(AssetsMap, ConfigFiles);
StripSVGTextures(EnvironmentAsset, AssetsMap, svgs)
ValidateReferencedMeshes(AssetsMap, ConfigFiles);
ValidateReferencedAnimations(AssetsMap, ConfigFiles);
ValidateMaterials(EnvironmentAsset, AssetsMap, ConfigFiles);
ExportGLB(EnvironmentAsset, AssetsMap);
ExportConfig(configHierarchy, ConfigFiles, collisionMaps.collisionMap, collisionMaps.attackCollisionMap);

