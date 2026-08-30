import Inventory from '../../models/Inventory';

export async function getInventory(userId: string) {
    return Inventory.findOne({
        userId,
    });
}

export async function clearInventory(userId: string) {
    return Inventory.updateOne(
        { userId },
        {
            $set: {
                items: [],
            },
        },
    );
}

export async function createInventory(userId: string) {
    return Inventory.create({
        userId,
        items: [],
    });
}

export interface ItemInput {
    itemId: string;
    quantity: number;
}

export async function addItems(userId: string, items: ItemInput[]) {
    if (items.length === 0) {
        return;
    }

    const inventory = await Inventory.findOneAndUpdate(
        { userId },
        {
            $setOnInsert: {
                userId,
            },
        },
        {
            returnDocument: 'after',
            upsert: true,
        },
    );

    for (const item of items) {
        if (item.quantity <= 0) {
            continue;
        }

        const existing = inventory.items.find((i) => i.itemId === item.itemId);

        if (existing) {
            existing.quantity += item.quantity;
        } else {
            inventory.items.push({
                itemId: item.itemId,
                quantity: item.quantity,
            });
        }
    }

    await inventory.save();
}

export async function removeItem(
    userId: string,
    itemId: string,
    quantity: number,
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
    );

    return true;
}
