import History from "../../models/History";
import type { ItemInput } from "../inventory/InventoryService";

export async function getHistory(
    userId: string,
) {
    return History.findOne({
        userId,
    });
}

export async function createHistory(
    userId: string,
) {
    return History.create({
        userId,
        items: [],
    });
}

export async function addHistoryItems(
    userId: string,
    items: ItemInput[],
) {
    if (items.length === 0) {
        return;
    }

    const history =
        await History.findOneAndUpdate(
            { userId },
            {
                $setOnInsert: {
                    userId,
                },
            },
            {
                returnDocument: "after",
                upsert: true,
            },
        );

    for (const item of items) {
        if (item.quantity <= 0) {
            continue;
        }

        const existing =
            history.items.find(
                i =>
                    i.itemId ===
                    item.itemId,
            );

        if (existing) {
            existing.quantity +=
                item.quantity;
        } else {
            history.items.push({
                itemId: item.itemId,
                quantity: item.quantity,
            });
        }
    }

    await history.save();
}