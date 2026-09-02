import { MIN_AMOUNT, BASE_MAX_AMOUNT } from '../../config/BalanceConfig';
import { randomInt } from '../../shared/utils/random';

export function calculateMiningAmount(effective: number): number {
    const maxAmount = Math.max(
        MIN_AMOUNT,
        Math.floor(BASE_MAX_AMOUNT * effective),
    );

    return randomInt(MIN_AMOUNT, maxAmount);
}
