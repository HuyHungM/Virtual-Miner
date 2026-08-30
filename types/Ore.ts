export interface Ore {
    id: string;
    name: string;
    emoji: string;
    biome: string;
    value: number;
    xp: number;
    chance: number;

    /**
     * 1 = common
     * 2 = uncommon
     * 3 = rare
     * 4 = epic
     * 5 = legendary
     */
    rarity: number;
}
