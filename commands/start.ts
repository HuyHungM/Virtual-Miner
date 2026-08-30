import { MessageFlags } from "discord.js";
import type { Command } from "../types/Command"
import { createUser, getUser } from "../services/user/UserService";
import { createInventory } from "../services/inventory/InventoryService";
import { createHistory } from "../services/history/HistoryService";

export default {
    name: "start",
    description: "Bắt đầu khai thác",
    run: async (client, interaction) => {
        const userId = interaction.user.id;
        const user = await getUser(userId);
        // Check user
        if (user) {
            await interaction.reply({
                content: "Tài khoản đã tồn tại trên hệ thống",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        
        // Create info
        await createUser(userId);
        await createInventory(userId);
        await createHistory(userId);

        await interaction.reply({
            content: "Đã tạo tài khoản thành công!\nChúc bạn may mắn trên con đường trở thành vua cày cuốc :)"
        })
    }
} satisfies Command;