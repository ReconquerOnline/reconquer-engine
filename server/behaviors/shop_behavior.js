import { validShopArgs } from "../inventory.js";

export default class ShopBehavior {
    constructor() {
        this.shops = {};
        this.ticks = 0;
    }
    update(worldState) {
        // restock/destock logic
        this.ticks += 1;
        if (this.ticks % 25 != 0) return;

        for (var key in this.shops) {
            var shopOwner = worldState.pub[key];
            var shop = this.shops[key];
            for (var slot in shop) {
                var initialQuantity = shop[slot].quantity ? shop[slot].quantity : 0;
                if (shopOwner[slot].length == 0) continue;
                var currentQuantity = shopOwner[slot][1];
                var respawnAmount = shop[slot].respawnAmount ? shop[slot].respawnAmount : .25;
                if (respawnAmount < 1) {
                    var random = Math.random();
                    if (random > respawnAmount) continue;
                    respawnAmount = 1;
                }
                if (currentQuantity > initialQuantity) {
                    shopOwner[slot][1] -= respawnAmount;
                    shopOwner[slot][1] = Math.max(shopOwner[slot][1], initialQuantity);
                } else if (currentQuantity < initialQuantity) {
                    shopOwner[slot][1] += respawnAmount;
                    shopOwner[slot][1] = Math.min(shopOwner[slot][1], initialQuantity);
                }
                if (shopOwner[slot][1] == 0 && !shop[slot].quantity) {
                    shopOwner[slot] = [];
                }
            }
        }

        this.ticks = 0;

    }
    addShop(item) {
        var shop = item.priv.shop;
        this.shops[item.pub.i] = shop;
        for (var key in validShopArgs) {
            if (!shop[key]) continue;
            if (shop[key].itemId) {
                item.pub[key] = [shop[key].itemId, shop[key].quantity];
            } else {
                item.pub[key] = [];
            }
        }
    }
}
