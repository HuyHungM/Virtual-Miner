import type { Client } from "discord.js";
import { readdirSync } from "fs"
import { join } from "path"

const Resource = {
    Biomes: "biomes",
    Ores: "ores",
    Pickaxes: "pickaxes"
} as const;

export default async (client : Client) => {
    const folders = readdirSync(join(".", ".", "resources"));

    for (const resouceType of folders) {
        const files = readdirSync(join(".", ".", "resources", resouceType));

        for (const name of files) {
            if (!name.endsWith(".ts")) continue;
            const resource = await import(`../resources/${resouceType}/${name}`);

            const data = resource.default;
            if (!data) continue;
            switch (resouceType) {
                case Resource.Biomes:
                    client.resources.biomes.set(data.id, data);
                    console.log(`[BIOME] Đã tải ${data.id}`)
                    break;
                case Resource.Ores:
                    client.resources.ores.set(data.id, data);
                    console.log(`[ORE] Đã tải ${data.id}`)
                    break;
                case Resource.Pickaxes:
                    client.resources.pickaxes.set(data.id, data);
                    console.log(`[PICKAXE] Đã tải ${data.id}`)
                    break;
            }
        }
    }
}