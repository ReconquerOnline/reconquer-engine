export default function handleInteraction(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];
    userPriv.msb += 1;
}