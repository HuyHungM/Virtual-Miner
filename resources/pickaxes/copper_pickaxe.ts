import type { Pickaxe } from "../../types/Pickaxe";

export default {
    name: "Cúp đồng",
    id: "copper_pickaxe",
    price: 5000,
    unlock_level: 1,
    description: "Cứng hơn một chút rồi",
    emoji: "1543192473273106472",
    buff: {
        effective: 0.3,
        fortune: 0.2,
        chest_chance: 0,
        chest_quality: 0,
        xp_multiplier: 0,
        sell_price: 0,
    }
} satisfies Pickaxe