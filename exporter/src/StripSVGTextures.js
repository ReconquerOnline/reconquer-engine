
function StripSVGTextures(environment, assetsMap, svgs) {

    function mark(node) {
        var mesh = node.getMesh();
        if (mesh) {
            mesh.listPrimitives().forEach(function (prim) {
                var material = prim.getMaterial();
                if (material) {
                    if (material.getBaseColorTexture() && svgs[material.getBaseColorTexture().getName() + '.svg']) {
                        var name = material.getBaseColorTexture().getName();
                        var extras = material.getExtras();
                        extras.baseColorTexture = name + '.svg';
                        material.setExtras(extras);
                    }
                    if (material.getEmissiveTexture() && svgs[material.getEmissiveTexture().getName() + '.svg']) {
                        var name = material.getEmissiveTexture().getName();        
                        var extras = material.getExtras();
                        extras.emissiveTexture = name + '.svg';
                        material.setExtras(extras);
                    }
                    if (material.getNormalTexture() && svgs[material.getNormalTexture().getName() + '.svg']) {
                        var name = material.getNormalTexture().getName();
                        var extras = material.getExtras();
                        extras.normalTexture = name + '.svg';
                        material.setExtras(extras);
                    }
                    if (material.getOcclusionTexture() && svgs[material.getOcclusionTexture().getName() + '.svg']) {
                        var name = material.getOcclusionTexture().getName(); 
                        var extras = material.getExtras();
                        extras.occlusionTexture = name + '.svg';
                        material.setExtras(extras);
                    }
                }
            });
        }
    }

    function strip(node) {
        var mesh = node.getMesh();
        if (mesh) {
            mesh.listPrimitives().forEach(function (prim) {
                var material = prim.getMaterial();
                if (material) {
                    if (material.getBaseColorTexture() && svgs[material.getBaseColorTexture().getName() + '.svg']) {
                        material.getBaseColorTexture().dispose();
                        material.setBaseColorTexture(null);
                    }
                    if (material.getEmissiveTexture() && svgs[material.getEmissiveTexture().getName() + '.svg']) { 
                        material.getEmissiveTexture().dispose();
                        material.setEmissiveTexture(null);
                    }
                    if (material.getNormalTexture() && svgs[material.getNormalTexture().getName() + '.svg']) {   
                        material.getNormalTexture().dispose();
                        material.setNormalTexture(null);
                    }
                    if (material.getOcclusionTexture() && svgs[material.getOcclusionTexture().getName() + '.svg']) {     
                        material.getOcclusionTexture().dispose();
                        material.setOcclusionTexture(null);
                    }
                }
            });
        }
    }

    environment.getRoot().getDefaultScene().traverse(mark);
    for (var id in assetsMap) {
        assetsMap[id].glb_doc.getRoot().getDefaultScene().traverse(mark);
    }
    environment.getRoot().getDefaultScene().traverse(strip);
    for (var id in assetsMap) {
        assetsMap[id].glb_doc.getRoot().getDefaultScene().traverse(strip);
    }
}

export default StripSVGTextures;