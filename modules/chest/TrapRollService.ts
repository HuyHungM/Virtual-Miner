import type { TrapType } from '../../types/Trap';
import {
    CHEST_NORMAL_CHANCE,
    TRAP_WEIGHTS,
    TRAP_MIN_LEVEL,
    TRAP_SELECTION_SCALE_START,
    STUN_STRONG_START_LEVEL,
    STUN_STRONG_MAX_WEIGHT,
    SLOW_VALUES,
    SLOW_STRONG_START_LEVEL,
    SLOW_70_PCT,
    SLOW_STRONG_MAX_WEIGHT,
    PIGLIN_ROBBERY,
    PIGLIN_150_CHANCE,
    PIGLIN_200_START_LEVEL,
    PIGLIN_MAX_CHANCE,
    PIGLIN_ROBBERY_20_WEIGHT,
    PIGLIN_ROBBERY_200_START_LEVEL,
} from '../../config/BalanceConfig';
import { rollChance } from '../../shared/utils/random';

/**
 * Pure probability helpers for treasure chest traps. No database access.
 */

/** Linear 0..1 ramp between `startLevel` and `startLevel + rampSpan`. */
function ramp(level: number, startLevel: number, rampSpan: number): number {
    if (level <= startLevel) return 0;
    return Math.min(1, (level - startLevel) / rampSpan);
}

function pickWeighted<T>(entries: { value: T; weight: number }[]): T {
    const total = entries.reduce((sum, e) => sum + Math.max(0, e.weight), 0);
    let roll = Math.random() * Math.max(total, 1e-9);

    for (const entry of entries) {
        roll -= Math.max(0, entry.weight);
        if (roll <= 0) return entry.value;
    }

    return entries[entries.length - 1]!.value;
}

export function rollChestKind(): boolean {
    return rollChance(CHEST_NORMAL_CHANCE);
}

/**
 * Returns the traps available to the player's current level.
 * (Unavailable traps never participate in the roll.)
 */
export function getAvailableTraps(level: number): TrapType[] {
    return (Object.keys(TRAP_WEIGHTS) as TrapType[]).filter(
        (trap) => level >= (TRAP_MIN_LEVEL[trap] ?? Number.MAX_SAFE_INTEGER),
    );
}

/** Scales a trap's selection weight upward from its scale-start level. */
function scaleSelectionWeight(trap: TrapType, level: number): number {
    const base = TRAP_WEIGHTS[trap] ?? 0;
    const start = TRAP_SELECTION_SCALE_START[trap] ?? TRAP_MIN_LEVEL[trap] ?? 1;
    // Stun ramps from level 5, piglin from level 200. Mining slow keeps its
    // base weight (its scaling is entirely in severity), so leave it flat.
    const rampSpan = 40;
    const factor =
        trap === 'stun' || trap === 'piglin_robbery'
            ? 1 + ramp(level, start, rampSpan) * 3
            : 1;
    return base * factor;
}

/**
 * Selects exactly one trap from the traps available at `level`, with weights
 * normalized among those available.
 */
export function rollTrapType(level: number): TrapType {
    const available = getAvailableTraps(level);
    if (available.length === 0) return 'stun';

    const scaled = available.map((trap) => ({
        value: trap,
        weight: scaleSelectionWeight(trap, level),
    }));

    return pickWeighted(scaled);
}

/**
 * Rolls a stun duration in minutes. Low levels prefer 1m/3m; from
 * STUN_STRONG_START_LEVEL the 5m/10m share grows up to STUN_STRONG_MAX_WEIGHT.
 */
export function rollStunDuration(level: number): number {
    const strongShare =
        STUN_STRONG_MAX_WEIGHT * ramp(level, STUN_STRONG_START_LEVEL, 60);

    const weakWeight = [1, 3].map((d) => ({
        value: d,
        weight: 100 * (1 - strongShare),
    }));
    const strongWeight = [5, 10].map((d) => ({
        value: d,
        weight: 100 * strongShare,
    }));

    return pickWeighted([...weakWeight, ...strongWeight]);
}

/**
 * Rolls a mining slow percentage. 15%/30% common at low level; 45% grows from
 * SLOW_STRONG_START_LEVEL; 70% is always exactly SLOW_70_PCT of slow outcomes.
 */
export function rollSlowPercent(level: number): number {
    const strongShare =
        SLOW_STRONG_MAX_WEIGHT * ramp(level, SLOW_STRONG_START_LEVEL, 80);

    const weak15 = 100 * (1 - strongShare - SLOW_70_PCT) * 0.7;
    const weak30 = 100 * (1 - strongShare - SLOW_70_PCT) * 0.3;
    const strong45 = 100 * strongShare;

    return pickWeighted([
        { value: SLOW_VALUES[0]!, weight: weak15 },
        { value: SLOW_VALUES[1]!, weight: weak30 },
        { value: SLOW_VALUES[2]!, weight: strong45 },
        { value: SLOW_VALUES[3]!, weight: SLOW_70_PCT * 100 },
    ]);
}

/**
 * Roll the Piglin appearance chance (~%). At Lv150 it is ~1%; from
 * PIGLIN_200_START_LEVEL it ramps toward PIGLIN_MAX_CHANCE.
 */
export function getPiglinAppearanceChance(level: number): number {
    const scaled =
        PIGLIN_150_CHANCE +
        (PIGLIN_MAX_CHANCE - PIGLIN_150_CHANCE) *
            ramp(level, PIGLIN_200_START_LEVEL, 80);
    return Math.max(PIGLIN_150_CHANCE, Math.min(PIGLIN_MAX_CHANCE, scaled));
}

/**
 * Rolls a robbery percentage. The 20% outcome always has exactly
 * PIGLIN_ROBBERY_20_WEIGHT (≈1% of piglin outcomes). Between 5% and 10%,
 * the more common outcome shifts after PIGLIN_ROBBERY_200_START_LEVEL.
 */
export function rollRobberyPercent(level: number): number {
    const t = ramp(level, PIGLIN_ROBBERY_200_START_LEVEL, 60);

    const weight5 = (100 - PIGLIN_ROBBERY_20_WEIGHT) * (1 - t * 0.8);
    const weight10 = 100 - PIGLIN_ROBBERY_20_WEIGHT - weight5;

    return pickWeighted([
        { value: PIGLIN_ROBBERY[0]!, weight: Math.max(1, weight5) },
        { value: PIGLIN_ROBBERY[1]!, weight: Math.max(1, weight10) },
        { value: PIGLIN_ROBBERY[2]!, weight: PIGLIN_ROBBERY_20_WEIGHT },
    ]);
}
