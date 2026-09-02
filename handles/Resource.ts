import type { Client } from 'discord.js';

import { resources } from '../resources/manifest';

export default async (client: Client) => {
    for (const data of resources.biomes) {
        client.resources.biomes.set(data.id, data);
        console.log(`[BIOME] Đã tải ${data.id}`);
    }

    for (const data of resources.boosts) {
        client.resources.boosts.set(data.id, data);
        console.log(`[BOOST] Đã tải ${data.id}`);
    }

    for (const data of resources.ores) {
        client.resources.ores.set(data.id, data);
        console.log(`[ORE] Đã tải ${data.id}`);
    }

    for (const data of resources.pickaxes) {
        client.resources.pickaxes.set(data.id, data);
        console.log(`[PICKAXE] Đã tải ${data.id}`);
    }

    for (const data of resources.pets) {
        client.resources.pets.set(data.id, data);
        console.log(`[PET] Đã tải ${data.id}`);
    }

    for (const data of resources.charms) {
        client.resources.charms.set(data.id, data);
        console.log(`[CHARM] Đã tải ${data.id}`);
    }

    for (const data of resources.potions) {
        client.resources.potions.set(data.id, data);
        console.log(`[POTION] Đã tải ${data.id}`);
    }

    for (const data of resources.backpacks) {
        client.resources.backpacks.set(data.id, data);
        console.log(`[BACKPACK] Đã tải ${data.id}`);
    }

    for (const data of resources.enemies) {
        client.resources.enemies.set(data.id, data);
        console.log(`[ENEMY] Đã tải ${data.id}`);
    }
};
