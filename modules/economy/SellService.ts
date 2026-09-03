import mongoose from 'mongoose';
import type { Client, TextBasedChannel, ColorResolvable } from 'discord.js';

import { clearInventory, getInventory } from '../inventory/InventoryService';
import { updateBalance } from './BalanceService';
import { getUpgradeStats } from '../upgrade/UpgradeService';
import { getPetBonusForStat } from '../pet/PetStatService';
import { getCharmBonusForStat } from '../charm/CharmService';
import { updateQuestProgress } from '../quest/QuestService';
import { sendQuestCompletedNotice } from '../quest/QuestRenderer';

export interface SellResult {
    soldItems: number;
    totalQuantity: number;
    totalValue: number;
}

export function calculateSellMultiplier(client: Client, user: any): number {
    const stats = getUpgradeStats(user);

    const pickaxe = client.resources.pickaxes.get(user?.pickaxe ?? '');

    const petSellBonus = getPetBonusForStat(client, user, 'sell_price');

    const charmSellBonus = getCharmBonusForStat(client, user, 'sell_price');

    const sellMultiplier =
        stats.sell_price *
        (1 + (pickaxe?.buff?.sell_price ?? 0) + petSellBonus + charmSellBonus);

    return sellMultiplier;
}

export function calculateSellResult(
    client: Client,
    items: any[],
    sellPriceMultiplier: number,
): SellResult {
    const result: SellResult = {
        soldItems: 0,
        totalQuantity: 0,
        totalValue: 0,
    };

    for (const item of items) {
        const ore = client.resources.ores.get(item.itemId);

        if (!ore) {
            throw new Error(`Unknown item in inventory: ${item.itemId}`);
        }

        if (item.quantity <= 0) {
            continue;
        }

        result.soldItems++;
        result.totalQuantity += item.quantity;

        result.totalValue += ore.value * item.quantity;
    }

    if (result.totalValue <= 0) {
        return {
            soldItems: 0,
            totalQuantity: 0,
            totalValue: 0,
        };
    }

    result.totalValue = Math.floor(result.totalValue * sellPriceMultiplier);

    return result;
}

export async function sellAll(
    client: Client,
    user: any,
    channel?: TextBasedChannel | null,
): Promise<SellResult> {
    const session = await mongoose.startSession();

    try {
        let result: SellResult = {
            soldItems: 0,
            totalQuantity: 0,
            totalValue: 0,
        };

        const sellMultiplier = calculateSellMultiplier(client, user);

        await session.withTransaction(async () => {
            const inventory = await getInventory(user.userId, session);

            if (!inventory || inventory.items.length === 0) {
                return;
            }

            result = calculateSellResult(
                client,
                inventory.items,
                sellMultiplier,
            );

            if (result.totalValue <= 0) {
                return;
            }

            await updateBalance(user.userId, result.totalValue, session);

            await clearInventory(user.userId, session);

            if (result.totalValue > 0) {
                const questResult = await updateQuestProgress(
                    client,
                    user.userId,
                    [{ type: 'earn_money', amount: result.totalValue }],
                    session,
                );

                if (questResult && questResult.notices.length > 0) {
                    await sendQuestCompletedNotice(
                        client,
                        channel,
                        user.userId,
                        questResult.notices,
                        user.color as ColorResolvable,
                    );
                }
            }
        });

        return result;
    } finally {
        await session.endSession();
    }
}
