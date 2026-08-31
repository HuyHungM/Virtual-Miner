export interface CurvePoint {
    level: number;
    value: number;
}

// ============================================
// SAFE INTEGER LIMITS
// balance/xp are stored as BSON doubles (exact up to 2^53 - 1). These caps
// guarantee the stored values never exceed the exact-integer safe range.
// ============================================
export const MAX_SAFE_MONEY = Number.MAX_SAFE_INTEGER;
export const MAX_SAFE_XP = Number.MAX_SAFE_INTEGER;

// ============================================
// XP CURVE (significantly harder, steep endgame)
// Lv50 ~ 1.06M · Lv150 ~ 23.8M · Lv250 ~ 195M · Lv300 ~ 561M · Lv500 ~ 7.7B
// Bounded tail, no divergence. (was: impossible divergent tail)
// ============================================
export const XP_POINTS: CurvePoint[] = [
    { level: 1, value: 200 },
    { level: 10, value: 5_000 },
    { level: 50, value: 80_000 },
    { level: 150, value: 500_000 },
    { level: 300, value: 12_000_000 },
    { level: 500, value: 80_000_000 },
];

/** Tail growth after the last XP point (per level). */
export const XP_TAIL_GROWTH = 1.1;

// ============================================
// MINING
// ============================================
export const MIN_AMOUNT = 3;
export const BASE_MAX_AMOUNT = 5;

// ============================================
// UPGRADES
// ============================================
/** +25% per upgrade level (multiplicative base). */
export const BONUS_PER_LEVEL = 0.25;

export interface UpgradeCostConfig {
    baseCost: number;
    growth: number;
    maxLevel: number;
}

export const PRIMARY_UPGRADE: UpgradeCostConfig = {
    baseCost: 500,
    growth: 2.3,
    maxLevel: 20,
};

export const CHEST_UPGRADE: UpgradeCostConfig = {
    baseCost: 700,
    growth: 2.25,
    maxLevel: 15,
};

// ============================================
// FORTUNE (rarity weight curve, softened)
// ============================================
export const FORTUNE_RARITY_DIVISOR = 3;

// ============================================
// CHESTS (complement to mining, ~10-30% of income)
// Values scale by BIOME TIER (0=plains .. 4=abyss), not raw divergent level.
// ============================================
/** Per biome tier (index 0..4): approximate value of a money chest base. */
export const CHEST_MONEY_BY_TIER = [100, 5_000, 400_000, 2_000_000, 20_000_000];
/** Per biome tier: approximate value of an XP chest base. */
export const CHEST_XP_BY_TIER = [50, 500, 8_000, 40_000, 300_000];
export const CHEST_MIN_REWARD_MULTIPLIER = 0.8;
export const CHEST_MAX_REWARD_MULTIPLIER = 1.2;
export const CHEST_BASE_CHANCE = 8;
export const CHEST_MAX_CHANCE = 40;

// ============================================
// PETS
// ============================================
export const PET_MAX_LEVEL = 50;
export const PET_LEVEL_SCALE_FACTOR = 0.02;
export const PET_BASE_DROP_CHANCE = 2;
export const PET_LEVEL_DROP_BONUS = 0.05;
export const PET_MAX_DROP_CHANCE = 25;
export const PET_DUPLICATE_XP_BASE = 200;
export const PET_RARITY_TIERS: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5,
    mythic: 6,
};
export const PET_DROP_RARITY_WEIGHTS: Record<string, number> = {
    common: 50,
    uncommon: 28,
    rare: 14,
    epic: 6,
    legendary: 1.8,
    mythic: 0.2,
};
