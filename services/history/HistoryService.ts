import type { ClientSession } from 'mongoose';

import type { ItemInput } from '../../types/Item';

import History from '../../models/History';

export async function getHistory(userId: string, session?: ClientSession) {
    return History.findOne({
        userId,
    }).session(session ?? null);
}

export async function createHistory(userId: string, session?: ClientSession) {
    return History.create(
        [
            {
                userId,
                items: [],
            },
        ],
        { session },
    ).then(([history]) => history);
}

export async function addMiningStats(
    userId: string,
    items: ItemInput[],
    session?: ClientSession,
) {
    const validItems = items.filter((item) => item.quantity > 0);

    if (validItems.length === 0) {
        return;
    }

    await History.updateOne(
        { userId },
        {
            $setOnInsert: {
                userId,
                items: [],
            },
        },
        {
            upsert: true,
            session,
        },
    );

    const quantities = new Map<string, number>();

    for (const item of validItems) {
        quantities.set(
            item.itemId,
            (quantities.get(item.itemId) ?? 0) + item.quantity,
        );
    }

    for (const [itemId, quantity] of quantities) {
        const result = await History.updateOne(
            {
                userId,
                'items.itemId': itemId,
            },
            {
                $inc: {
                    'items.$.quantity': quantity,
                },
            },
            {
                session,
            },
        );

        if (result.matchedCount === 0) {
            await History.updateOne(
                {
                    userId,
                    'items.itemId': {
                        $ne: itemId,
                    },
                },
                {
                    $push: {
                        items: {
                            itemId,
                            quantity,
                        },
                    },
                },
                {
                    session,
                },
            );
        }
    }
}
