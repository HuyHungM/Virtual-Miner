import type { Client } from "discord.js";

export function validateMining(
    client: Client,
    pickaxeId: string,
    biomeId: string,
) {
    const pickaxe =
        client.resources.pickaxes.get(
            pickaxeId,
        );

    const biome =
        client.resources.biomes.get(
            biomeId,
        );

    if (!pickaxe || !biome) {
        return {
            success: false as const,
            reason: "RESOURCE_NOT_FOUND" as const,
        };
    }

    if (
        !pickaxe.biomes.includes(
            biome.id,
        )
    ) {
        const minimumPickaxe =
            client.resources.pickaxes.get(
                biome.minimum_pickaxe,
            );

        return {
            success: false as const,
            reason: "PICKAXE_TOO_WEAK" as const,

            biome,
            pickaxe,
            minimumPickaxe,
        };
    }

    return {
        success: true as const,

        biome,
        pickaxe,
    };
}