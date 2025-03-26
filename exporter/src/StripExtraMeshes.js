function StripExtraMeshes(assetsMap, configFile) {
    for (var id in assetsMap) {
        var config = configFile[id];
        if (config && config.removeMeshes) {
            assetsMap[id].glb_doc.getRoot().getDefaultScene().traverse(function(node) {
                if (config.removeMeshes.includes(node.getName())) {
                    node.dispose();
                }
            });
        }
    }
}

export default StripExtraMeshes;