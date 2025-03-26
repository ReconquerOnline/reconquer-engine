export default function handleInteraction(interaction, target, key, worldState) {
    var userPriv = worldState.priv[key];
    userPriv.zedit += 1;
}