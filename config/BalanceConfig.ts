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
export const PET_MAX_LEVEL = 500;
export const PET_LEVEL_SCALE_FACTOR = 0.02;
/** Fraction of the player's mining XP granted to the equipped pet. */
export const PET_MINING_XP_MULTIPLIER = 0.05;

// ---- Combat pets ----
export const DEFAULT_ATTACK_SPEED = 1;
/** Safety cap so a combat loop can never run away. */
export const COMBAT_MAX_TURNS = 200;
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

// ============================================
// CHARMS
// ============================================
/** Charms cannot exceed Level 10. */
export const CHARM_MAX_LEVEL = 10;
/** Base % chance a treasure chest yields a charm. */
export const CHARM_BASE_DROP_CHANCE = 4;
/** Hard cap on the charm drop chance (%). */
export const CHARM_MAX_DROP_CHANCE = 30;
/** Per-player-level bonus added to the charm drop chance (%). */
export const CHARM_LEVEL_DROP_BONUS = 0.02;
/** Bonus growth per charm level beyond 1 (linear multiplier). */
export const CHARM_LEVEL_SCALE_FACTOR = 0.02;

// ============================================
// TREASURE CHEST TRAPS
// ============================================

// ---- Chest type distribution (FIXED, independent of level) ----
export const CHEST_NORMAL_CHANCE = 70;
export const CHEST_TRAPPED_CHANCE = 30;

// ---- Trap selection weights inside a Trapped Chest (normalized) ----
export const TRAP_WEIGHTS: Record<string, number> = {
    stun: 40,
    mining_slow: 40,
    piglin_robbery: 20,
};

// ---- Minimum player level for each trap ----
export const TRAP_MIN_LEVEL: Record<string, number> = {
    stun: 5,
    mining_slow: 20,
    piglin_robbery: 150,
};

// ---- Level at which each trap's selection probability starts to scale up ----
export const TRAP_SELECTION_SCALE_START: Record<string, number> = {
    stun: 5,
    mining_slow: 30,
    piglin_robbery: 200,
};

// ---- Stun ----
/** Possible stun durations in minutes. */
export const STUN_DURATIONS = [1, 3, 5, 10];
/** Level from which longer stuns (5m/10m) become increasingly likely. */
export const STUN_STRONG_START_LEVEL = 25;
/** Max % weight tallied to the "strong" (5m/10m) durations at high level. */
export const STUN_STRONG_MAX_WEIGHT = 0.6;

// ---- Mining Slow ----
/** Possible mining slow percentages. */
export const SLOW_VALUES = [0.15, 0.3, 0.45, 0.7];
/** Level from which stronger slows (45%/70%) become increasingly likely. */
export const SLOW_STRONG_START_LEVEL = 100;
/** The 70% slow always occupies this weight share of Mining Slow outcomes. */
export const SLOW_70_PCT = 0.05;
/** Max % weight tallied to the "strong" (45%/70%) slows at high level. */
export const SLOW_STRONG_MAX_WEIGHT = 0.7;

// ---- Piglin Robbery ----
/** Possible robbery percentages. */
export const PIGLIN_ROBBERY = [0.05, 0.1, 0.2];
/** Piglin appearance chance (~%) when the trap first unlocks at Lv150. */
export const PIGLIN_150_CHANCE = 0.01;
/** Level from which Piglin appearance starts to ramp up. */
export const PIGLIN_200_START_LEVEL = 200;
/** Piglin appearance chance cap (~%) at very high level. */
export const PIGLIN_MAX_CHANCE = 0.08;
/** The 20% robbery outcome always has exactly this weight (≈1% of piglin outcomes). */
export const PIGLIN_ROBBERY_20_WEIGHT = 1;
/** Level from which 10% robbery overtakes 5%. */
export const PIGLIN_ROBBERY_200_START_LEVEL = 200;

// ---- Mining cooldown (minimal system built for Stun/Slow) ----
/** How long a Mining Slow effect lasts (minutes) before expiring. */
export const MINING_SLOW_DURATION = 30;

// ============================================
// DAILY REWARD
// ============================================
/** How long a player must wait between successful daily claims (ms). */
export const DAILY_COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours

/** Reward category selection weights (sum = 100). */
export const DAILY_CHANCES = {
    money: 35,
    xp: 30,
    charm: 20,
    gem: 15,
};

/** Base share of the level's best pickaxe price used for the daily money reward. */
export const DAILY_MONEY_BASE_FRACTION = 0.0025;

/** Top pickaxe price per biome tier (calibration anchors). */
export const DAILY_MONEY_PICKAXE_POINTS: CurvePoint[] = [
    { level: 1, value: 200_000 },
    { level: 50, value: 15_000_000 },
    { level: 150, value: 900_000_000 },
    { level: 250, value: 7_500_000_000 },
    { level: 500, value: 50_000_000_000 },
];

/** Expected money earned per mine at each biome unlock level (calibrated from the ore economy). */
export const DAILY_MONEY_EARN_POINTS: CurvePoint[] = [
    { level: 1, value: 7 },
    { level: 50, value: 75 },
    { level: 150, value: 376 },
    { level: 250, value: 1323 },
    { level: 500, value: 3745 },
];

/** Expected XP earned per mine at each biome unlock level (calibrated from the ore economy). */
export const DAILY_XP_EARN_POINTS: CurvePoint[] = [
    { level: 1, value: 7 },
    { level: 50, value: 60 },
    { level: 150, value: 269 },
    { level: 250, value: 907 },
    { level: 500, value: 2407 },
];

/** Bonus share of the money earned while gaining the current level. */
export const DAILY_MONEY_BONUS_FRACTION = 0.1;

/** XP reward as a fraction of the player's current required XP. */
export const DAILY_XP_FRACTION = 0.15;

/** Gem reward range (inclusive random). */
export const DAILY_GEM = {
    min: 1,
    max: 5,
};

// ============================================
// DAILY QUESTS
// ============================================
/** Number of quests generated and active per user per day. */
export const QUEST_COUNT = 3;

/** Reward category selection weights (sum = 100). */
export const QUEST_REWARD_CHANCES = {
    money: 30,
    xp: 30,
    charm: 20,
    gem: 20,
};

/** Money reward scale applied on top of the existing daily money-economy formula. */
export const QUEST_MONEY_SCALE = 0.5;

/** XP reward as a fraction of the XP required at the current level. */
export const QUEST_XP_FRACTION = 0.1;

/** Gem reward range (inclusive random). */
export const QUEST_GEM = {
    min: 1,
    max: 10,
};

/** Charm reward growth anchored to the player's level. */
export const QUEST_CHARM_POINTS: CurvePoint[] = [
    { level: 1, value: 1 },
    { level: 50, value: 3 },
    { level: 150, value: 6 },
    { level: 250, value: 10 },
    { level: 500, value: 18 },
];

/** Hard cap on the charm reward granted per quest. */
export const QUEST_CHARM_MAX = 20;

/**
 * Requirement anchors per quest type (level -> realistic daily target).
 * Log-interpolated at generation so requirements grow smoothly with level.
 */
export type QuestRequirementKey =
    'mine' | 'collect_ores' | 'level_up' | 'open_chests' | 'earn_money';

export const QUEST_REQUIREMENT_POINTS: Record<
    QuestRequirementKey,
    CurvePoint[]
> = {
    mine: [
        { level: 1, value: 30 },
        { level: 50, value: 150 },
        { level: 150, value: 450 },
        { level: 250, value: 750 },
        { level: 500, value: 1200 },
    ],
    collect_ores: [
        { level: 1, value: 120 },
        { level: 50, value: 600 },
        { level: 150, value: 1800 },
        { level: 250, value: 3000 },
        { level: 500, value: 4800 },
    ],
    open_chests: [
        { level: 1, value: 10 },
        { level: 50, value: 60 },
        { level: 150, value: 150 },
        { level: 250, value: 250 },
        { level: 500, value: 300 },
    ],
    earn_money: [
        { level: 1, value: 500 },
        { level: 50, value: 15_000 },
        { level: 150, value: 450_000 },
        { level: 250, value: 1_500_000 },
        { level: 500, value: 5_000_000 },
    ],
    level_up: [
        { level: 1, value: 2 },
        { level: 50, value: 3 },
        { level: 150, value: 3 },
        { level: 250, value: 2 },
        { level: 500, value: 1 },
    ],
};

// ============================================
// BACKPACKS & MINING COOLDOWN
// ============================================
/** Absolute floor for the final mining cooldown (seconds). */
export const MINING_MIN_COOLDOWN = 2.5;
/** Fallback base cooldown when a biome has no explicit `cooldown`. */
export const DEFAULT_BIOME_COOLDOWN = 3.5;

// ---- Trap countermeasure items ----
export const TRAP_IMMUNITY_DURATION = 10; // minutes
export const MILK_PRICE_LOW = 20;
export const MILK_PRICE_HIGH = 50;
export const MILK_PRICE_THRESHOLD = 200;
export const RESIST_POTION_PRICE = 10;
