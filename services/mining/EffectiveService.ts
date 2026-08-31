import { MIN_AMOUNT, BASE_MAX_AMOUNT } from '../balance/BalanceConfig';

export function calculateMiningAmount(effective: number): number {
    const maxAmount = Math.max(
        MIN_AMOUNT,
        Math.floor(BASE_MAX_AMOUNT * effective),
    );

    return (
        Math.floor(Math.random() * (maxAmount - MIN_AMOUNT + 1)) + MIN_AMOUNT
    );
}
