import type { ClientSession } from 'mongoose';
import Inventory from '../../models/Inventory';
import type { ItemInput } from '../../types/Item';

export async function getInventory(userId: string, session?: ClientSession) {
    return Inventory.findOne({
        userId,
    }).session(session ?? null);
}

export async function clearInventory(userId: string, session?: ClientSession) {
    return Inventory.updateOne(
        { userId },
        {
            $set: {
                items: [],
            },
        },
        { session },
    );
}

export async function createInventory(userId: string, session?: ClientSession) {
    return Inventory.create(
        [
            {
                userId,
                items: [],
            },
        ],
        { session },
    ).then(([inventory]) => inventory);
}

export async function addItems(
    userId: string,
    items: ItemInput[],
    session?: ClientSession,
) {
    const validItems = items.filter((item) => item.quantity > 0);

    if (validItems.length === 0) {
        return;
    }

    await Inventory.updateOne(
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
        const result = await Inventory.updateOne(
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
            await Inventory.updateOne(
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

export async function removeItem(
    userId: string,
    itemId: string,
    quantity: number,
    session?: ClientSession,
): Promise<boolean> {
    if (quantity <= 0) {
        return false;
    }

    const result = await Inventory.updateOne(
        {
            userId,
            items: {
                $elemMatch: {
                    itemId,
                    quantity: {
                        $gte: quantity,
                    },
                },
            },
        },
        {
            $inc: {
                'items.$.quantity': -quantity,
            },
        },
        {
            session,
        },
    );

    if (result.modifiedCount === 0) {
        return false;
    }

    await Inventory.updateOne(
        {
            userId,
        },
        {
            $pull: {
                items: {
                    itemId,
                    quantity: 0,
                },
            },
        },
        {
            session,
        },
    );

    return true;
}
