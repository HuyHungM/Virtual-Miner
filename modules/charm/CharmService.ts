import type { ClientSession } from 'mongoose';
import type { Client } from 'discord.js';

import User from '../../models/User';
import {
    CHARM_MAX_LEVEL,
    CHARM_LEVEL_SCALE_FACTOR,
    QUEST_CHARM_POINTS,
    QUEST_CHARM_MAX,
} from '../../config/BalanceConfig';
import { interpolate } from '../progression/ProgressionService';
import type { Buff } from '../../types/Buff';
import type { OwnedCharm } from '../../types/Charm';

/**
 * Copies required to go from Level `level` to Level `level + 1`.
 * (First copy grants Level 1, then each step N -> N+1 needs N+1 copies.)
 */
export function getCharmCopiesRequired(level: number): number {
    return Math.max(1, level + 1);
}

/**
 * Bonus for a charm level. Linear growth configured by
 * CHARM_LEVEL_SCALE_FACTOR, capped to the charm max level.
 */
export function calculateCharmBonus(baseValue: number, level: number): number {
    const safeLevel = Math.max(1, Math.min(CHARM_MAX_LEVEL, level));
    return baseValue * (1 + (safeLevel - 1) * CHARM_LEVEL_SCALE_FACTOR);
}

/**
 * Applies `amount` copies onto a charm at (level, copies), advancing levels
 * as soon as enough copies are collected. Never exceeds CHARM_MAX_LEVEL —
 * any excess copies beyond max level are discarded.
 */
export function applyCharmCopies(
    level: number,
    copies: number,
    amount: number,
): { level: number; copies: number } {
    let currentLevel = Math.max(1, level);
    let currentCopies = Math.max(0, copies) + Math.max(0, amount);

    while (
        currentLevel < CHARM_MAX_LEVEL &&
        currentCopies >= getCharmCopiesRequired(currentLevel)
    ) {
        currentCopies -= getCharmCopiesRequired(currentLevel);
        currentLevel++;
    }

    if (currentLevel >= CHARM_MAX_LEVEL) {
        currentCopies = 0;
    }

    return { level: currentLevel, copies: currentCopies };
}

export function getOwnedCharm(
    user: any,
    charmId: string,
): OwnedCharm | undefined {
    return user.charms?.find((c: OwnedCharm) => c.charmId === charmId);
}

export function isCharmOwned(user: any, charmId: string): boolean {
    return user.charms?.some((c: OwnedCharm) => c.charmId === charmId) ?? false;
}

/**
 * Level-scaled charm reward shared by Daily Quests and the Daily Reward.
 * Always within [1, QUEST_CHARM_MAX] (1..20).
 */
export function getDailyCharmReward(level: number): number {
    const safeLevel = Math.max(1, level);

    return Math.max(
        1,
        Math.min(QUEST_CHARM_MAX, interpolate(QUEST_CHARM_POINTS, safeLevel)),
    );
}

/** Summed bonus across all owned charms — each charm feeds only its own stat. */
export function getCharmStatBonus(client: Client, user: any): Partial<Buff> {
    const bonuses: Partial<Buff> = {};

    for (const owned of user.charms ?? []) {
        const def = client.resources.charms.get(owned.charmId);

        if (!def) continue;

        const stat = def.stat as keyof Buff;

        bonuses[stat] =
            (bonuses[stat] ?? 0) +
            calculateCharmBonus(def.baseValue, owned.level);
    }

    return bonuses;
}

export function getCharmBonusForStat(
    client: Client,
    user: any,
    stat: keyof Buff,
): number {
    return getCharmStatBonus(client, user)[stat] ?? 0;
}

/**
 * Atomically grants `amount` copies of `charmId` to the player inside the
 * given transaction. Creates the charm at Level 1 if the player does not own
 * it yet, or advances its level otherwise. Guarantees a single charm record
 * per player+charm and never exceeds CHARM_MAX_LEVEL.
 */
export async function addCharmCopies(
    client: Client,
    userId: string,
    charmId: string,
    amount: number,
    session?: ClientSession,
): Promise<OwnedCharm> {
    if (amount <= 0) {
        throw new Error('INVALID_QUANTITY');
    }

    if (!client.resources.charms.has(charmId)) {
        throw new Error('INVALID_CHARM_ID');
    }

    const user = await User.findOne({ userId }).session(session ?? null);
    if (!user) throw new Error('USER_NOT_FOUND');

    const owned = getOwnedCharm(user, charmId);

    let result: OwnedCharm;

    if (owned) {
        const next = applyCharmCopies(owned.level, owned.copies, amount);
        owned.level = next.level;
        owned.copies = next.copies;
        result = owned;
    } else {
        const next = applyCharmCopies(1, 0, amount);
        const freshCharm: OwnedCharm = {
            charmId,
            level: next.level,
            copies: next.copies,
        };
        user.charms.push(freshCharm);
        result = freshCharm;
    }

    await user.save({ session });

    return result;
}
