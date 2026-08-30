export interface UpgradeStats {
    effective: number;
    fortune: number;
    sell_price: number;
    xp_multiplier: number;
    chest_chance: number;
    chest_quality: number;
}

const BONUS_PER_LEVEL = 0.25;

export function getUpgradeMultiplier(level: number): number {
    return 1 + Math.max(0, level) * BONUS_PER_LEVEL;
}

export function getUpgradeStats(user: any): UpgradeStats {
    const upgrades = user.upgrades;

    return {
        effective: getUpgradeMultiplier(upgrades.effective),

        fortune: getUpgradeMultiplier(upgrades.fortune),

        sell_price: getUpgradeMultiplier(upgrades.sell_price),

        xp_multiplier: getUpgradeMultiplier(upgrades.xp_multiplier),

        chest_chance: getUpgradeMultiplier(upgrades.chest_chance),

        chest_quality: getUpgradeMultiplier(upgrades.chest_quality),
    };
}
