import mongoose from "mongoose";
import type { Collection } from "discord.js";

import User from "../../models/User";
import Inventory from "../../models/Inventory";

import type { Ore } from "../../types/Ore";

export interface SellResult {
    soldItems: number;
    totalQuantity: number;
    totalValue: number;
}

export async function sellAll(
    userId: string,
    ores: Collection<string, Ore>,
    sellPriceMultiplier = 0,
): Promise<SellResult> {
    const session =
        await mongoose.startSession();

    try {
        let result: SellResult = {
            soldItems: 0,
            totalQuantity: 0,
            totalValue: 0,
        };

        await session.withTransaction(
            async () => {
                const inventory =
                    await Inventory.findOne({
                        userId,
                    }).session(session);

                if (
                    !inventory ||
                    inventory.items.length === 0
                ) {
                    return;
                }

                for (const item of inventory.items) {
                    const ore =
                        ores.get(item.itemId);

                    if (!ore) {
                        throw new Error(
                            `Unknown item in inventory: ${item.itemId}`,
                        );
                    }

                    if (item.quantity <= 0) {
                        continue;
                    }

                    result.soldItems++;
                    result.totalQuantity +=
                        item.quantity;

                    result.totalValue +=
                        ore.value *
                        item.quantity;
                }

                if (result.totalValue <= 0) {
                    return;
                }

                result.totalValue =
                    Math.floor(
                        result.totalValue *
                        (1 + sellPriceMultiplier),
                    );

                await User.updateOne(
                    { userId },
                    {
                        $inc: {
                            balance:
                                result.totalValue,
                        },
                    },
                    { session },
                );

                await Inventory.updateOne(
                    { userId },
                    {
                        $set: {
                            items: [],
                        },
                    },
                    { session },
                );
            },
        );

        return result;
    } finally {
        await session.endSession();
    }
}