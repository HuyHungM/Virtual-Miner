import type { ClientSession } from 'mongoose';

import User from '../../models/User';

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
    return User.findOneAndUpdate(
        { userId },
        {
            $inc: {
                balance: amount,
            },
        },
        {
            returnDocument: 'after',
            session,
        },
    );
}
