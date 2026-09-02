import type { Client } from 'discord.js';

import { getBiomeTier } from './getBiomeTier';

export function validateMining(
    client: Client,
    pickaxeId: string,
    biomeId: string,
) {
    const pickaxe = client.resources.pickaxes.get(pickaxeId);

    const biome = client.resources.biomes.get(biomeId);

    if (!pickaxe || !biome) {
        return {
            success: false as const,
            reason: 'RESOURCE_NOT_FOUND' as const,
        };
    }

    // A pickaxe can mine its own biome and any biome of the same or lower tier.
    const pickaxeTier = Math.max(
        ...(pickaxe.biomes.length
            ? pickaxe.biomes.map((b) => getBiomeTier(client, b))
            : [-1]),
    );

    const targetTier = getBiomeTier(client, biome.id);

    if (pickaxeTier < targetTier) {
        const minimumPickaxe = client.resources.pickaxes.get(
            biome.minimum_pickaxe,
        );

        return {
            success: false as const,
            reason: 'PICKAXE_TOO_WEAK' as const,

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
