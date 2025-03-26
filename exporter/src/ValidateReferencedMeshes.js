function ValidateReferencedMeshes(assetsMap, configFile) {
    for (var id in assetsMap) {
        var config = configFile[id];
        if (config && config.state) {
            var actualMeshes = [];
            assetsMap[id].glb_doc.getRoot().getDefaultScene().traverse(function(node) {
                actualMeshes.push(node.getName());
            });
            var expectedMeshes = config.state
                .filter(x => x.behavior == 'chooseMesh')
                .map(x => x.options)
                .flat()
                .filter(x => x != null)
                .concat(
                    config.state
                    .filter(x => x.behavior == 'chooseMaterial')
                    .map(x => x.target)
                    .flat()
                );
            var notReferencedMeshes = expectedMeshes.filter(x => !actualMeshes.includes(x));
            if (notReferencedMeshes.length > 0) {
                throw new Error('Non existing mesh referenced in ' + id + ' config file: ' + notReferencedMeshes);
            }
        }
    }
}

export default ValidateReferencedMeshes;