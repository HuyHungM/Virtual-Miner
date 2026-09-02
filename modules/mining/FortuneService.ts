import { FORTUNE_RARITY_DIVISOR } from '../../config/BalanceConfig';

export function getFortuneMultiplier(fortune: number, rarity: number): number {
    if (rarity <= 1) {
        return 1;
    }

    return 1 + ((fortune - 1) * (rarity - 1)) / FORTUNE_RARITY_DIVISOR;
}
