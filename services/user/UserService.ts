import type { ClientSession } from 'mongoose';

import User from '../../models/User';
import type { ActiveBoost } from '../../types/ActiveBoost';
import type { OwnedPet } from '../../types/Pet';
import { MAX_SAFE_MONEY } from '../balance/BalanceConfig';

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

export async function updateBalance(
    userId: string,
    amount: number,
    session?: ClientSession,
) {
    // Atomically add `amount` to balance, clamped to [0, MAX_SAFE_MONEY] so
    // the stored value never exceeds the exact-integer safe range (2^53 - 1).
    // A pipeline update computes server-side from the current value, avoiding
    // both negative balances and overflow past Number.MAX_SAFE_INTEGER.
    return User.findOneAndUpdate(
        { userId },
        [
            {
                $set: {
                    balance: {
                        $max: [
                            0,
                            {
                                $min: [
                                    MAX_SAFE_MONEY,
                                    {
                                        $add: [
                                            { $ifNull: ['$balance', 0] },
                                            amount,
                                        ],
                                    },
                                ],
                            },
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

export async function updateGems(
    userId: string,
    amount: number,
    session?: ClientSession,
) {
    return User.findOneAndUpdate(
        { userId },
        {
            $inc: {
                gems: amount,
            },
        },
        {
            returnDocument: 'after',
            session,
        },
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
                                            { $ne: ['$$b.boostId', boost.boostId] },
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

export async function equipPet(
    userId: string,
    petId: string,
    session?: ClientSession,
) {
    return User.findOneAndUpdate(
        { userId, 'pets.petId': petId },
        { $set: { equippedPet: petId } },
        { returnDocument: 'after', session },
    );
}

export async function unequipPet(
    userId: string,
    session?: ClientSession,
) {
    return User.findOneAndUpdate(
        { userId },
        { $set: { equippedPet: null } },
        { returnDocument: 'after', session },
    );
}

export async function addPet(
    userId: string,
    petId: string,
    session?: ClientSession,
): Promise<{ owned: OwnedPet; isDuplicate: boolean; xpAwarded: number }> {
    const user = await User.findOne({ userId }).session(session ?? null);
    if (!user) throw new Error('USER_NOT_FOUND');

    const existing = user.pets.find((p) => p.petId === petId);

    if (existing) {
        const xpAwarded = 200;
        existing.xp = existing.xp + xpAwarded;
        await user.save({ session });
        return { owned: existing, isDuplicate: true, xpAwarded };
    }

    const newPet: OwnedPet = { petId, level: 1, xp: 0 };
    user.pets.push(newPet);
    await user.save({ session });
    return { owned: newPet, isDuplicate: false, xpAwarded: 0 };
}
