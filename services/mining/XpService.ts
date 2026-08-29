import type { Ore } from "../../types/Ore";

export function calculateOreXp(
    ore: Ore,
    amount: number,
    multiplier: number,
): number {
    return Math.floor(
        ore.xp *
        amount * multiplier,
    );
}