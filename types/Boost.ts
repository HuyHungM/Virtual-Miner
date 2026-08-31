export interface Boost {
    id: string;
    /** Group id shared by all duration variants of the same boost type. */
    boostId: string;
    name: string;
    description: string;
    emoji: string;
    price: number;
    duration: number;
    stat: 'effective' | 'fortune' | 'chest_chance' | 'chest_quality';
    multiplier: number;
}
