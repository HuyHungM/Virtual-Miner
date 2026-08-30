import type { Pickaxe } from "../../types/Pickaxe";

export default {
    name: "Cúp sắt",
    id: "iron_pickaxe",
    biomes: ["plains"],
    price: 100000,
    unlock_level: 1,
    description: "Thời kì đồ sắt. Tăng kinh nghiệm nhận được.",
    emoji: "1543192470802931722",
    buff: {
        effective: 0.5,
        fortune: 0.3,
        chest_chance: 0.2,
        chest_quality: 0.2,
        xp_multiplier: 0.1,
        sell_price: 0,
    }
} satisfies Pickaxe