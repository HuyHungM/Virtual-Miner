import type { ClientSession } from 'mongoose';

import User from '../../models/User';
import { MAX_SAFE_MONEY } from '../../config/BalanceConfig';

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
