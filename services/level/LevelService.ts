import type { ClientSession } from 'mongoose';

import { getUser } from '../user/UserService';

export interface LevelUpResult {
    oldLevel: number;
    newLevel: number;
    xp: number;
    xpRequired: number;
    levelsGained: number;
}

const XP_POINTS = [
    {
        level: 1,
        xp: 200,
    },
    {
        level: 10,
        xp: 5_000,
    },
    {
        level: 150,
        xp: 1_000_000,
    },
];

export function getRequiredXp(level: number): number {
    if (level <= 1) {
        return 200;
    }

    let start = XP_POINTS[0]!;
    let end = XP_POINTS[1]!;

    for (let i = 1; i < XP_POINTS.length; i++) {
        const point = XP_POINTS[i]!;

        if (level <= point.level) {
            end = point;
            start = XP_POINTS[i - 1]!;
            break;
        }

        start = point;
        end = point;
    }

    if (level >= XP_POINTS[XP_POINTS.length - 1]!.level) {
        const last = XP_POINTS[XP_POINTS.length - 1]!;

        const growth = Math.pow(1.075, level - last.level);

        return Math.floor(last.xp * growth);
    }

    const progress = (level - start.level) / (end.level - start.level);

    const xp = Math.exp(
        Math.log(start.xp) + progress * (Math.log(end.xp) - Math.log(start.xp)),
    );

    return Math.floor(xp);
}

export function calculateLevel(
    level: number,
    xp: number,
): {
    level: number;
    xp: number;
} {
    let currentLevel = Math.max(1, level);

    let currentXp = Math.max(0, xp);

    while (currentXp >= getRequiredXp(currentLevel)) {
        currentXp -= getRequiredXp(currentLevel);

        currentLevel++;
    }

    return {
        level: currentLevel,
        xp: currentXp,
    };
}

export async function addXp(
    userId: string,
    amount: number,
    session?: ClientSession,
): Promise<LevelUpResult | null> {
    if (amount <= 0) {
        return null;
    }

    const user = await getUser(userId, session);

    if (!user) {
        return null;
    }

    const oldLevel = user.level;

    const result = calculateLevel(user.level, user.xp + amount);

    user.level = result.level;
    user.xp = result.xp;

    await user.save({
        session,
    });

    return {
        oldLevel,
        newLevel: result.level,
        xp: result.xp,
        xpRequired: getRequiredXp(result.level),
        levelsGained: result.level - oldLevel,
    };
}
