import type { Client } from "discord.js";
import type { Ore } from "../../types/Ore";

import {
    getFortuneMultiplier,
} from "./FortuneService";

export function getBiomeOres(
    client: Client,
    biomeId: string,
): Ore[] {
    return [
        ...client.resources.ores.values(),
    ].filter(
        ore =>
            ore.biome === biomeId &&
            ore.chance > 0,
    );
}

export function calculateOreChance(
    ore: Ore,
    fortune: number,
): number {
    const multiplier =
        getFortuneMultiplier(
            fortune,
            ore.rarity,
        );

    return Math.min(
        100,
        ore.chance * multiplier,
    );
}

export function rollOres(
    ores: Ore[],
    amount: number,
    fortune: number,
): Ore[] {
    if (
        ores.length === 0 ||
        amount <= 0
    ) {
        return [];
    }

    const result: Ore[] = [];

    for (let i = 0; i < amount; i++) {
        const ore =
            rollSingleOre(
                ores,
                fortune,
            );

        result.push(ore);
    }

    return result;
}

// Roll
function rollSingleOre(
    ores: Ore[],
    fortune: number,
): Ore {
    const weightedOres =
        ores.map(ore => ({
            ore,
            chance:
                calculateOreChance(
                    ore,
                    fortune,
                ),
        }));

    const totalChance =
        weightedOres.reduce(
            (total, item) =>
                total + item.chance,
            0,
        );

    // Fallback
    if (totalChance <= 0) {
        return ores[
            Math.floor(
                Math.random() *
                ores.length,
            )
        ]!;
    }

    let random =
        Math.random() *
        totalChance;

    for (const item of weightedOres) {
        random -= item.chance;

        if (random <= 0) {
            return item.ore;
        }
    }

    return ores[
        ores.length - 1
    ]!;
}