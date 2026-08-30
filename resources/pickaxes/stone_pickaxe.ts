import type { Pickaxe } from "../../types/Pickaxe";

export default {
    name: "Cúp đá",
    id: "stone_pickaxe",
    biomes: ["plains"],
    price: 500,
    unlock_level: 1,
    description: "Thời kì đồ đá. Món hàng đầu tiên.",
    emoji: "1543192475374583818",
    buff: {
        effective: 0.15,
        fortune: 0.1,
        chest_chance: 0,
        chest_quality: 0,
        xp_multiplier: 0,
        sell_price: 0,
    }
} satisfies Pickaxe