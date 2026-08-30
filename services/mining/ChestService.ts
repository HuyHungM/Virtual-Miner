export interface ChestResult {
    opened: boolean;
    money: number;
    xp: number;
}

interface CurvePoint {
    level: number;
    value: number;
}

// Config
const MONEY_CURVE: CurvePoint[] = [
    {
        level: 1,
        value: 100,
    },
    {
        level: 10,
        value: 2_000,
    },
    {
        level: 150,
        value: 1_000_000,
    },
];

const XP_CURVE: CurvePoint[] = [
    {
        level: 1,
        value: 50,
    },
    {
        level: 10,
        value: 1_200,
    },
    {
        level: 150,
        value: 300_000,
    },
];

const MIN_REWARD_MULTIPLIER = 0.8;
const MAX_REWARD_MULTIPLIER = 1.2;

const MAX_CHEST_CHANCE = 100;

function rollChestChance(
    chance: number,
): boolean {
    const safeChance =
        Math.max(
            0,
            Math.min(
                MAX_CHEST_CHANCE,
                chance,
            ),
        );
    return (
        Math.random() * 100 <
        safeChance
    );
}

/**
 * Money:
 * Lv1   = 100
 * Lv10  = 2,000
 * Lv150 = 1,000,000
 *
 * XP:
 * Lv1   = 50
 * Lv10  = 1,200
 * Lv150 = 300,000
 */
function interpolateCurve(
    level: number,
    points: CurvePoint[],
): number {
    const safeLevel =
        Math.max(
            1,
            level,
        );

    if (points.length === 0) {
        return 0;
    }

    if (
        safeLevel <=
        points[0]!.level
    ) {
        return points[0]!.value;
    }

    for (
        let i = 1;
        i < points.length;
        i++
    ) {
        const start =
            points[i - 1]!;

        const end =
            points[i]!;

        if (
            safeLevel <=
            end.level
        ) {
            const progress =
                (
                    safeLevel -
                    start.level
                ) /
                (
                    end.level -
                    start.level
                );

            /*
             * value =
             * start *
             * (end / start) ^ progress
             */

            const value =
                start.value *
                Math.pow(
                    end.value /
                    start.value,
                    progress,
                );

            return Math.floor(
                value,
            );
        }
    }

    const last =
        points[
            points.length - 1
        ]!;

    const previous =
        points[
            points.length - 2
        ]!;

    const growth =
        Math.pow(
            last.value /
            previous.value,
            1 /
            (
                last.level -
                previous.level
            ),
        );

    return Math.floor(
        last.value *
        Math.pow(
            growth,
            safeLevel -
            last.level,
        ),
    );
}

function rollRewardMultiplier(): number {
    return (
        MIN_REWARD_MULTIPLIER +
        Math.random() *
        (
            MAX_REWARD_MULTIPLIER -
            MIN_REWARD_MULTIPLIER
        )
    );
}

function calculateMoneyReward(
    level: number,
    quality: number,
): number {
    const base =
        interpolateCurve(
            level,
            MONEY_CURVE,
        );

    const qualityMultiplier =
        Math.max(
            1,
            quality,
        );

    const randomMultiplier =
        rollRewardMultiplier();

    return Math.max(
        1,
        Math.floor(
            base *
            qualityMultiplier *
            randomMultiplier,
        ),
    );
}

function calculateXpReward(
    level: number,
    quality: number,
): number {
    const base =
        interpolateCurve(
            level,
            XP_CURVE,
        );

    const qualityMultiplier =
        Math.max(
            1,
            quality,
        );

    const randomMultiplier =
        rollRewardMultiplier();

    return Math.max(
        1,
        Math.floor(
            base *
            qualityMultiplier *
            randomMultiplier,
        ),
    );
}

// main

export function rollChest(
    chestChance: number,
    chestQuality: number,
    level: number,
): ChestResult {

    const opened =
        rollChestChance(
            chestChance,
        );

    if (!opened) {
        return {
            opened: false,
            money: 0,
            xp: 0,
        };
    }

    const money =
        calculateMoneyReward(
            level,
            chestQuality,
        );

    const xp =
        calculateXpReward(
            level,
            chestQuality,
        );

    return {
        opened: true,
        money,
        xp,
    };
}