export interface BackpackDef {
    id: string;
    name: string;
    biome: string;
    tier: number;
    price: number;
    emoji: string;
}

export interface OwnedBackpack {
    backpackId: string;
    biome: string;
    tier: number;
}
