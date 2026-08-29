import {
    EmbedBuilder,
    MessageFlags,
    type ColorResolvable,
} from "discord.js";

import { getUser } from "../services/user/UserService";
import { mine } from "../services/mining/MiningService";

import type { Command } from "../types/Command";

export default {
    name: "mine",
    description: "Đi đào khoáng sản",

    run: async (client, interaction) => {
        const user = await getUser(interaction.user.id);

        if (!user) {
            await interaction.reply({
                content:
                    "Bạn chưa tạo tài khoản.\n" +
                    "`/start` để bắt đầu hành trình cày cuốc của bạn.",
                flags: MessageFlags.Ephemeral,
            });

            return;
        }

        const result = await mine(client, user);

        if (!result.success) {
            if (result.reason === "RESOURCE_NOT_FOUND") {
                await interaction.reply({
                    content: "Đã xảy ra lỗi.",
                    flags: MessageFlags.Ephemeral,
                });

                return;
            }

            if (result.reason === "PICKAXE_TOO_WEAK") {
                const {
                    biome,
                    minimumPickaxe,
                } = result;

                const emoji = minimumPickaxe
                    ? client.appEmojis.get(minimumPickaxe.emoji) ?? ""
                    : "";

                const embed = new EmbedBuilder()
                    .setColor(user.color as ColorResolvable)
                    .setDescription(
                        "Bạn đã cố đào nhưng block đã bị vỡ.\n" +
                        "Hãy thử đổi biome hoặc cây cúp của bạn.\n\n" +
                        `Yêu cầu tối thiểu: **${emoji} ` +
                        `${minimumPickaxe?.name ?? "Không xác định"}**`
                    );

                await interaction.reply({
                    embeds: [embed],
                });

                return;
            }
        }

        // TODO: result.ore
        // TODO: result.amount
        // TODO: result.xp
        // TODO: result.chest

        await interaction.reply("Đào thành công!");
    },
} satisfies Command;