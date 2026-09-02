import type { ClientSession } from 'mongoose';

import User from '../../models/User';
import type { ActiveBoost } from '../../types/ActiveBoost';

export async function getUser(userId: string, session?: ClientSession) {
    return User.findOne({
        userId,
    }).session(session ?? null);
}

export async function createUser(userId: string, session?: ClientSession) {
    return User.create(
        [
            {
                userId,
            },
        ],
        { session },
    ).then(([user]) => user);
}

/**
 * Atomically replaces the user's daily quests and day key without the
 * document-level `__v` optimistic filter (which whole-doc `save()` applies to
 * subarray changes). Concurrent writers in different transactions then settle
 * via a write conflict + `withTransaction` retry instead of a `VersionError`.
 */
export async function updateQuests(
    userId: string,
    quests: any[],
    questDay: string,
    session?: ClientSession,
) {
    return User.updateOne(
        { userId },
        { $set: { quests, questDay } },
        { session },
    );
}

export async function addActiveBoost(
    userId: string,
    boost: ActiveBoost,
    session?: ClientSession,
) {
    const now = new Date();

    // Atomically drop expired boosts and any active boost of the same type,
    // then append the new one. Guarantees one active boost per boost type.
    return User.findOneAndUpdate(
        { userId },
        [
            {
                $set: {
                    active_boosts: {
                        $concatArrays: [
                            {
                                $filter: {
                                    input: {
                                        $ifNull: ['$active_boosts', []],
                                    },
                                    as: 'b',
                                    cond: {
                                        $and: [
                                            {
                                                $ne: [
                                                    '$$b.boostId',
                                                    boost.boostId,
                                                ],
                                            },
                                            { $gt: ['$$b.expiresAt', now] },
                                        ],
                                    },
                                },
                            },
                            [
                                {
                                    boostId: boost.boostId,
                                    expiresAt: boost.expiresAt,
                                },
                            ],
                        ],
                    },
                },
            },
        ],
        {
            returnDocument: 'after',
            updatePipeline: true,
            session,
        },
    );
}

export async function removeActiveBoost(
    userId: string,
    boostId: string,
    session?: ClientSession,
) {
    return User.findOneAndUpdate(
        { userId },
        {
            $pull: {
                active_boosts: {
                    boostId,
                },
            },
        },
        {
            returnDocument: 'after',
            session,
        },
    );
}

export async function incrementUpgrade(
    userId: string,
    stat: string,
    session?: ClientSession,
) {
    return User.findOneAndUpdate(
        { userId },
        {
            $inc: {
                [`upgrades.${stat}`]: 1,
            },
        },
        {
            returnDocument: 'after',
            session,
        },
    );
}

export async function addUnlockedPickaxe(
    userId: string,
    pickaxeId: string,
    session?: ClientSession,
) {
    return User.findOneAndUpdate(
        { userId },
        {
            $addToSet: {
                unlocked_pickaxes: pickaxeId,
            },
            $set: {
                pickaxe: pickaxeId,
            },
        },
        {
            returnDocument: 'after',
            session,
        },
    );
}

export async function equipPickaxe(
    userId: string,
    pickaxeId: string,
    session?: ClientSession,
) {
    return User.findOneAndUpdate(
        { userId },
        {
            $set: {
                pickaxe: pickaxeId,
            },
        },
        {
            returnDocument: 'after',
            session,
        },
    );
}

export async function unlockBiome(
    userId: string,
    biomeId: string,
    session?: ClientSession,
) {
    return User.findOneAndUpdate(
        { userId },
        {
            $addToSet: {
                unlocked_biomes: biomeId,
            },
        },
        {
            returnDocument: 'after',
            session,
        },
    );
}

export async function setBiome(
    userId: string,
    biomeId: string,
    session?: ClientSession,
) {
    return User.findOneAndUpdate(
        { userId },
        {
            $set: {
                biome: biomeId,
            },
        },
        {
            returnDocument: 'after',
            session,
        },
    );
}
