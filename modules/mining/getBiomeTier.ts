import type { Client } from 'discord.js';

export function getBiomeTier(client: Client, biomeId: string): number {
    const ordered = [...client.resources.biomes.values()].sort(
        (a, b) => a.unlock_level - b.unlock_level,
    );

    return ordered.findIndex((b) => b.id === biomeId);
}
