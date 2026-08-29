import type { Client } from "discord.js";
import type { InferSchemaType } from "mongoose";

import UserSchema from "../../models/User";
import { validateMining } from "./MiningValidator";

type User = InferSchemaType<typeof UserSchema.schema>;

export async function mine(
    client: Client,
    user: User
) {
    const validation = validateMining(
        client,
        user.pickaxe,
        user.biome
    );

    if (!validation.success) {
        return validation;
    }

    const { pickaxe, biome } = validation;

    // TODO:
    // 1. Lấy ores của biome
    // 2. Tính effective
    // 3. Random ore
    // 4. Tính fortune
    // 5. Tính XP
    // 6. Tính chest
    // 7. Update inventory
    // 9. Tạo history

    return {
        success: true as const,
        pickaxe,
        biome,
    };
}