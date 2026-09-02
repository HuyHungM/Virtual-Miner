import type { ClientSession } from 'mongoose';
import type { Client } from 'discord.js';

import {
    MILK_PRICE_LOW,
    MILK_PRICE_HIGH,
    MILK_PRICE_THRESHOLD,
    RESIST_POTION_PRICE,
    TRAP_IMMUNITY_DURATION,
} from '../../config/BalanceConfig';
import { addActiveBoost } from '../user/UserService';
import { updateGems } from '../economy/BalanceService';
import { clearActiveTrap, IMMUNITY_BOOST_ID } from '../chest/TrapService';

export function getPotionPrice(potionId: string, level: number): number {
    if (potionId === 'milk') {
        return level >= MILK_PRICE_THRESHOLD ? MILK_PRICE_HIGH : MILK_PRICE_LOW;
    }
    if (potionId === 'resist_potion') {
        return RESIST_POTION_PRICE;
    }
    return 0;
}

export function getMilkPrice(level: number): number {
    return level >= MILK_PRICE_THRESHOLD ? MILK_PRICE_HIGH : MILK_PRICE_LOW;
}

export function getResistPrice(): number {
    return RESIST_POTION_PRICE;
}

/**
 * Buys and applies a countermeasure inside a transaction.
 *
 * - milk: clears the currently active trap (Stun or Mining Slow).
 * - resist_potion: grants 10 minutes of immunity to Stun/Mining Slow.
 */
export async function buyAndUsePotion(
    userId: string,
    level: number,
    potionId: string,
    session: ClientSession,
) {
    const price = getPotionPrice(potionId, level);

    if (price <= 0) {
        throw new Error('INVALID_POTION');
    }

    // Deduct gems first (rollback on any failure keeps this atomic).
    await updateGems(userId, -price, session);

    if (potionId === 'milk') {
        await clearActiveTrap(userId, session);
        return { potionId, removed: true as const };
    }

    if (potionId === 'resist_potion') {
        await addActiveBoost(
            userId,
            {
                boostId: IMMUNITY_BOOST_ID,
                expiresAt: new Date(
                    Date.now() + TRAP_IMMUNITY_DURATION * 60_000,
                ),
            },
            session,
        );
        return { potionId, removed: false as const };
    }

    throw new Error('INVALID_POTION');
}
