export type PotionEffect = 'milk' | 'resist';

export interface Potion {
    id: string;
    name: string;
    emoji: string;
    description: string;
    effect: PotionEffect;
    price: number;
}
