var actualMaterials = [];

function validateMaterial(asset) {
    var defaultScene = asset.getRoot().getDefaultScene();
    defaultScene.traverse(function(node) {
        var mesh = node.getMesh();
        if (mesh) {
            mesh.listPrimitives()
                .forEach(function(prim) {
                    if (prim.getMaterial()) {
                        var name = prim.getMaterial().getName();
                        if (!name.endsWith('Material')) {
                            throw new Error('Material does not end with Material: ' + name + ' in ' + defaultScene.listChildren()[0].getName());
                        }
                        actualMaterials.push(name);
                    }
                });
        }
    });
}

async function ValidateMaterials(environment, assetsMap, configFile) {
    validateMaterial(environment);

    for (var id in assetsMap) {
        validateMaterial(assetsMap[id].glb_doc);
    }

    // verify that every referenced material in config actually exists
    for (var id in configFile) {
        var config = configFile[id];

        var expectedMaterials = [];
        if (config.replaceMaterials) {
            for (var key in config.replaceMaterials) {
                expectedMaterials.push(key);
                expectedMaterials.push(config.replaceMaterials[key]);
            }   
        }

        if (config.state) {
            var expectedMaterials = expectedMaterials.concat(config.state
                .filter(x => x.behavior == 'chooseMaterial')
                .map(x => x.options)
                .flat());
        }
        var notReferencedMaterials = expectedMaterials.filter(x => !actualMaterials.includes(x));
        if (notReferencedMaterials.length > 0) {
            throw new Error('Non existing material referenced in ' + id + ' config file: ' + notReferencedMaterials);
        }
    }
}

export default ValidateMaterials;