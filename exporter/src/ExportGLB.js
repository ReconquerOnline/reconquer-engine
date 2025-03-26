import fs from 'fs';
import { Document, NodeIO, PropertyType, Verbosity } from '@gltf-transform/core';
import { resample, prune, dedup, draco } from '@gltf-transform/functions';
import path from 'path';
import zlib from 'zlib';

import OutputPath from './OutputPath.js';

function mergeToOneScene(doc) {
    var scenes = doc.getRoot().listScenes();
    for (var i = 1; i < scenes.length; i++) {
        var children = scenes[i].listChildren();
        for (var child of children) {
            scenes[0].addChild(child);
            scenes[i].removeChild(child);
        }
        scenes[i].dispose();
    }
    doc.getRoot().setDefaultScene(scenes[0]);
}

function consolidateMaterialsByName(doc, logMaterialSources) {
    var materialsMap = {};
    var parentName = null;
    var materialParentNameList = [];
    doc.getRoot().getDefaultScene().traverse(function (node) {
        if (node.listParents().filter(parent => parent.getName() == 'Scene')) {
            parentName = node.getName();
        }
        var mesh = node.getMesh();
        if (mesh) {
            mesh.listPrimitives()
                .forEach(function (prim) {
                    if (prim.getMaterial()) {
                        var name = prim.getMaterial().getName();
                        if (!materialsMap[name]) {
                            materialParentNameList.push(name + ': ' + parentName);
                            materialsMap[name] = prim.getMaterial();
                        } else {
                            prim.setMaterial(materialsMap[name]);
                        }
                    }
                });
        }
    });
    if (logMaterialSources) { console.log('MaterialSources:', JSON.stringify(materialParentNameList.sort(), null, 2)) };
    var materials = doc.getRoot().listMaterials();
    for (var material of materials) {
        if (!materialsMap[material.getName()]) {
            material.dispose();
        }
    }
}

function consolidateToOneBuffer(doc) {
    var buffer = doc.getRoot().listBuffers()[0];
    doc.getRoot().listAccessors()
        .forEach((a) => a.setBuffer(buffer));
    doc.getRoot().listBuffers()
        .forEach((b, index) => (index > 0 ? b.dispose() : null));
}

async function optimizeDocument(doc, logMaterialSources) {
    doc.getLogger().verbosity = Verbosity.ERROR;
    mergeToOneScene(doc);
    consolidateMaterialsByName(doc, logMaterialSources);
    await doc.transform(
        resample(),
        prune(),
        dedup({ propertyTypes: [PropertyType.MESH, PropertyType.TEXTURE, PropertyType.ACCESSOR] }),
        draco()
    );
    consolidateToOneBuffer(doc);
}

var io = new NodeIO()
async function ExportGLB(environment, assetsMap) {

    var assetSizes = [];

    await optimizeDocument(environment)
    var environmentGLB = await io.writeBinary(environment);
    assetSizes.push({
        id: 'environment',
        size: environmentGLB.length
    });

    var doc = new Document();
    doc.merge(environment);
    for (var id in assetsMap) {
        await optimizeDocument(assetsMap[id].glb_doc);
        var assetGLB = await io.writeBinary(assetsMap[id].glb_doc);
        assetSizes.push({
            id: id,
            size: assetGLB.length
        });
        doc.merge(assetsMap[id].glb_doc);
    }

    await optimizeDocument(doc, true);

    var glb = await io.writeBinary(doc);
    var compressedFile = zlib.gzipSync(glb);
    console.log('Asset Sizes:', JSON.stringify(assetSizes.sort((a, b) => a.size < b.size ? 1 : -1).map(asset => asset.id + ': ' + asset.size), null, 2));
    console.log('Total Size:', compressedFile.length, 'bytes');
    fs.writeFileSync(path.join(OutputPath, 'public', 'assets', 'assets.glb.zip'), compressedFile);
}

export default ExportGLB;