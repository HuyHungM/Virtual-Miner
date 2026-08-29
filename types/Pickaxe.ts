import type { Buff } from "./Buff";

export interface Pickaxe {
    name: string,
    id: string,
    biomes: [string],
    description: string,
    price: number,
    unlock_level: number,
    emoji: string,
    buff?: Buff
}