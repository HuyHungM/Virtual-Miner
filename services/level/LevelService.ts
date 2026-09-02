import type { ClientSession } from 'mongoose';

import { getUser } from '../user/UserService';

import {
    XP_POINTS,
    XP_TAIL_GROWTH,
    MAX_SAFE_XP,
    type CurvePoint,
} from '../balance/BalanceConfig';

export interface LevelUpResult {
    oldLevel: number;
    newLevel: number;
    xp: number;
    xpRequired: number;
    levelsGained: number;
}

export function interpolate(points: CurvePoint[], level: number): number {
    if (level <= points[0]!.level) {
        return points[0]!.value;
    }

    for (let i = 1; i < points.length; i++) {
        const start = points[i - 1]!;
        const end = points[i]!;

        if (level <= end.level) {
            const progress = (level - start.level) / (end.level - start.level);

            return Math.floor(
                Math.exp(
                    Math.log(start.value) +
                        progress *
                            (Math.log(end.value) - Math.log(start.value)),
                ),
            );
        }
    }

    const last = points[points.length - 1]!;

    return Math.floor(
        last.value * Math.pow(XP_TAIL_GROWTH, level - last.level),
    );
}

export function getRequiredXp(level: number): number {
    return interpolate(XP_POINTS, Math.max(1, level));
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

    const safeAmount = Math.min(amount, MAX_SAFE_XP);

    const result = calculateLevel(
        user.level,
        Math.min(user.xp + safeAmount, MAX_SAFE_XP),
    );

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
