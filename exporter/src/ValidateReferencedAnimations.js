function ValidateReferencedAnimations(assetsMap, configFile) {
    for (var id in assetsMap) {
        var config = configFile[id];
        if (config && config.state) {
            var actualAnimations = assetsMap[id].glb_doc.getRoot().listAnimations().map(x => x.getName());
            var expectedAnimations = config.state
                .filter(x => x.behavior == 'chooseAnimation')
                .map(x => x.options)
                .flat()
                .map(x => x.useAnimation || x.name);

            var notReferencedAnimations = expectedAnimations.filter(x => !actualAnimations.includes(x));
            if (notReferencedAnimations.length > 0) {
                throw new Error('Non existing animation referenced in ' + id + ' config file: ' + notReferencedAnimations);
            }
        }
    }
}

export default ValidateReferencedAnimations;