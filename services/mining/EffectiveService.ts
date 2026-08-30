const BASE_MAX_AMOUNT = 5;
const MIN_AMOUNT = 3;

export function calculateMiningAmount(effective: number): number {
    const maxAmount = Math.max(
        MIN_AMOUNT,
        Math.floor(BASE_MAX_AMOUNT * effective),
    );

    return (
        Math.floor(Math.random() * (maxAmount - MIN_AMOUNT + 1)) + MIN_AMOUNT
    );
}
