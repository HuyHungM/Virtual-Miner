import mongoose, { type ClientSession } from 'mongoose';
import type { Client } from 'discord.js';

import User from '../../models/User';
import type { LevelUpResult } from '../level/LevelService';
import { addXp, getRequiredXp, interpolate } from '../level/LevelService';
import { updateBalance, updateGems, getUser } from '../user/UserService';
import { addCharmCopies, getDailyCharmReward } from '../charm/CharmService';
import {
    DAILY_COOLDOWN_MS,
    DAILY_CHANCES,
    DAILY_MONEY_BASE_FRACTION,
    DAILY_MONEY_PICKAXE_POINTS,
    DAILY_MONEY_EARN_POINTS,
    DAILY_XP_EARN_POINTS,
    DAILY_MONEY_BONUS_FRACTION,
    DAILY_XP_FRACTION,
    DAILY_GEM,
} from '../balance/BalanceConfig';

export type DailyRewardCategory = 'money' | 'xp' | 'charm' | 'gem';

export type DailyRewardCharm = {
    charmId: string;
    name: string;
    emoji: string;
    level: number;
    levelsGained: number;
    isNew: boolean;
};

export type DailyClaimResult =
    | {
          ok: true;
          category: DailyRewardCategory;
          amount: number;
          charm?: DailyRewardCharm;
          levelUp?: LevelUpResult | null;
          nextClaimAt: Date;
      }
    | {
          ok: false;
          reason: 'COOLDOWN';
          remainingMs: number;
      };

/**
 * Level-scaled money reward: 0.25% of the level's best pickaxe price, plus
 * a bonus share of the money earned while gaining the current level
 * (mines needed for the level × expected money per mine).
 */
export function getDailyMoneyReward(level: number): number {
    const safeLevel = Math.max(1, level);

    const base =
        interpolate(DAILY_MONEY_PICKAXE_POINTS, safeLevel) *
        DAILY_MONEY_BASE_FRACTION;

    const minesPerLevel =
        getRequiredXp(safeLevel) / interpolate(DAILY_XP_EARN_POINTS, safeLevel);

    const bonus =
        minesPerLevel *
        interpolate(DAILY_MONEY_EARN_POINTS, safeLevel) *
        DAILY_MONEY_BONUS_FRACTION;

    return Math.floor(base + bonus);
}

/** Level-scaled XP reward: a fraction of the XP required at the current level. */
export function getDailyXpReward(level: number): number {
    return Math.floor(getRequiredXp(level) * DAILY_XP_FRACTION);
}

/** Weighted roll selecting exactly one reward category. */
export function rollDailyChance(): DailyRewardCategory {
    const entries = Object.entries(DAILY_CHANCES) as [
        DailyRewardCategory,
        number,
    ][];
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = Math.random() * total;

    for (const [category, weight] of entries) {
        roll -= weight;
        if (roll < 0) return category;
    }

    return entries[entries.length - 1]![0];
}

/** Random whole gems within the configured inclusive range. */
export function rollDailyGems(): number {
    return (
        DAILY_GEM.min +
        Math.floor(Math.random() * (DAILY_GEM.max - DAILY_GEM.min + 1))
    );
}

/**
 * Claims the Daily Reward. Validates the 12-hour per-user cooldown, then
 * atomically grants exactly one level-scaled reward (money/xp/charm/gem) and
 * stamps `lastDailyClaimAt` inside a single transaction. The reward is
 * computed from the player's current level at the moment of claiming.
 */
export async function claimDailyReward(
    client: Client,
    user: any,
): Promise<DailyClaimResult> {
    const now = Date.now();

    if (
        user.lastDailyClaimAt &&
        now - new Date(user.lastDailyClaimAt).getTime() < DAILY_COOLDOWN_MS
    ) {
        const remainingMs =
            DAILY_COOLDOWN_MS -
            (now - new Date(user.lastDailyClaimAt).getTime());

        return { ok: false, reason: 'COOLDOWN', remainingMs };
    }

    const session = await mongoose.startSession();

    try {
        const result = await session.withTransaction(
            async (): Promise<DailyClaimResult> => {
                // Re-read the freshest document so the cooldown check and the
                // level used for the reward are both authoritative at claim time.
                const fresh = await getUser(user.userId, session);

                if (!fresh) {
                    throw new Error('USER_NOT_FOUND');
                }

                const freshNow = Date.now();

                if (
                    fresh.lastDailyClaimAt &&
                    freshNow - new Date(fresh.lastDailyClaimAt).getTime() <
                        DAILY_COOLDOWN_MS
                ) {
                    const remainingMs =
                        DAILY_COOLDOWN_MS -
                        (freshNow - new Date(fresh.lastDailyClaimAt).getTime());

                    return { ok: false, reason: 'COOLDOWN', remainingMs };
                }

                const category = rollDailyChance();

                const grant: Omit<
                    Extract<DailyClaimResult, { ok: true }>,
                    'nextClaimAt'
                > = { ok: true, category, amount: 0, levelUp: null };

                if (category === 'money') {
                    const reward = getDailyMoneyReward(fresh.level);
                    await updateBalance(fresh.userId, reward, session);
                    grant.amount = reward;
                } else if (category === 'xp') {
                    const reward = getDailyXpReward(fresh.level);
                    grant.levelUp = await addXp(fresh.userId, reward, session);
                    grant.amount = reward;
                } else if (category === 'gem') {
                    const reward = rollDailyGems();
                    await updateGems(fresh.userId, reward, session);
                    grant.amount = reward;
                } else {
                    // charm
                    const charms = Array.from(client.resources.charms.values());

                    if (charms.length === 0) {
                        // No charms configured — fall back to money so a claim
                        // still grants something meaningful.
                        const reward = getDailyMoneyReward(fresh.level);
                        await updateBalance(fresh.userId, reward, session);
                        return {
                            ...grant,
                            category: 'money',
                            amount: reward,
                            nextClaimAt: new Date(freshNow + DAILY_COOLDOWN_MS),
                        };
                    }

                    const charm =
                        charms[Math.floor(Math.random() * charms.length)]!;

                    const owned = fresh.charms?.find(
                        (c: any) => c.charmId === charm.id,
                    );

                    const reward = getDailyCharmReward(fresh.level);

                    const ownedCharm = await addCharmCopies(
                        client,
                        fresh.userId,
                        charm.id,
                        reward,
                        session,
                    );

                    grant.amount = reward;
                    grant.charm = {
                        charmId: charm.id,
                        name: charm.name,
                        emoji: charm.emoji,
                        level: ownedCharm.level,
                        levelsGained: Math.max(
                            0,
                            ownedCharm.level - (owned?.level ?? 1),
                        ),
                        isNew: !owned,
                    };
                }

                await User.updateOne(
                    { userId: fresh.userId },
                    { $set: { lastDailyClaimAt: new Date(freshNow) } },
                    { session },
                );

                return {
                    ...grant,
                    nextClaimAt: new Date(freshNow + DAILY_COOLDOWN_MS),
                };
            },
        );

        return result;
    } finally {
        await session.endSession();
    }
}

export async function getDailyRemainingMs(
    userId: string,
    session?: ClientSession,
): Promise<number | null> {
    const user = await getUser(userId, session);

    if (!user?.lastDailyClaimAt) return null;

    const remaining =
        DAILY_COOLDOWN_MS -
        (Date.now() - new Date(user.lastDailyClaimAt).getTime());

    return remaining > 0 ? remaining : null;
}
