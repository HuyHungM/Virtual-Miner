import type { Pickaxe } from "../../types/Pickaxe";

export default {
    name: "Cúp đá đỏ",
    id: "redstone_pickaxe",
    price: 250000,
    unlock_level: 50,
    description: "Hiện đại hại điện",
    emoji: "1543193249622269982",
    buff: {
        effective: 0.6,
        fortune: 0.35,
        chest_chance: 0.25,
        chest_quality: 0.25,
        xp_multiplier: 0.15,
        sell_price: 0,
    }
} satisfies Pickaxe