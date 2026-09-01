import type { Client } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

const Resource = {
    Biomes: 'biomes',
    Boosts: 'boosts',
    Ores: 'ores',
    Pickaxes: 'pickaxes',
    Pets: 'pets',
    Charms: 'charms',
    Potions: 'potions',
    Backpacks: 'backpacks',
    Enemies: 'enemies',
} as const;

export default async (client: Client) => {
    const folders = readdirSync(join('.', '.', 'resources'));

    for (const resouceType of folders) {
        const files = readdirSync(join('.', '.', 'resources', resouceType));

        for (const name of files) {
            if (!name.endsWith('.ts')) continue;
            const resource = await import(
                `../resources/${resouceType}/${name}`
            );

            const data = resource.default;
            if (!data) continue;
            switch (resouceType) {
                case Resource.Biomes:
                    client.resources.biomes.set(data.id, data);
                    console.log(`[BIOME] Đã tải ${data.id}`);
                    break;
                case Resource.Boosts:
                    client.resources.boosts.set(data.id, data);
                    console.log(`[BOOST] Đã tải ${data.id}`);
                    break;
                case Resource.Ores:
                    client.resources.ores.set(data.id, data);
                    console.log(`[ORE] Đã tải ${data.id}`);
                    break;
                case Resource.Pickaxes:
                    client.resources.pickaxes.set(data.id, data);
                    console.log(`[PICKAXE] Đã tải ${data.id}`);
                    break;
                case Resource.Pets:
                    client.resources.pets.set(data.id, data);
                    console.log(`[PET] Đã tải ${data.id}`);
                    break;
                case Resource.Charms:
                    client.resources.charms.set(data.id, data);
                    console.log(`[CHARM] Đã tải ${data.id}`);
                    break;
                case Resource.Potions:
                    client.resources.potions.set(data.id, data);
                    console.log(`[POTION] Đã tải ${data.id}`);
                    break;
                case Resource.Backpacks:
                    client.resources.backpacks.set(data.id, data);
                    console.log(`[BACKPACK] Đã tải ${data.id}`);
                    break;
                case Resource.Enemies:
                    client.resources.enemies.set(data.id, data);
                    console.log(`[ENEMY] Đã tải ${data.id}`);
                    break;
            }
        }
    }
};
