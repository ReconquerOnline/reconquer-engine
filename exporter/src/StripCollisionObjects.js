function StripCollisionObjects(assetsMap) {
    for (var id in assetsMap) {
        assetsMap[id].glb_doc.getRoot().getDefaultScene().traverse(function (node) {
            if (node.getName().endsWith('_collision') || node.getName().endsWith('_attackcollision')) {
                node.dispose();
            }
        });
    }
}

export default StripCollisionObjects;