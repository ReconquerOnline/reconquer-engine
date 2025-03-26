export var validArgs = {};
for (var i = 0; i < 24; i++) {
    validArgs['i' + i] = true;
}
export var validEquipmentArgs = {
    ihe: true,
    in: true,
    ib: true,
    il: true,
    if: true,
    ihan: true,
    ish: true,
    iw: true
}

export var validShopArgs = {};
for (var i = 0; i < 16; i++) {
    validShopArgs['mi' + i] = true;
}

export var validTradeArgs = {};
for (var i = 0; i < 8; i++) {
    validTradeArgs['ti' + i] = true;
}

export var validBankArgs = {};
for (var i = 0; i < 64; i++) {
    validBankArgs['bi' + i] = true;
}