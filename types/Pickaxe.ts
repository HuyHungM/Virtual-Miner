import type { Buff } from "./Buff";

export interface Pickaxe {
    name: string,
    id: string,
    description: string,
    price: number,
    unlock_level: number,
    emoji: string,
    buff?: Buff
}