import { MessageFlags } from "discord.js";
import User from "../models/User";
import type { Command } from "../types/Command"
import Inventory from "../models/Inventory";
import History from "../models/History";
import { createUser, getUser } from "../services/user/UserService";

export default {
    name: "start",
    description: "Bắt đầu khai thác",
    run: async (client, interaction) => {
        const userId = interaction.user.id;
        const user = await getUser(userId);

        if (user) {
            await interaction.reply({
                content: "Tài khoản đã tồn tại trên hệ thống",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        
        const newUser = await createUser(userId);

        await Inventory.create({
            userId
        });
        await History.create({
            userId
        })

        await interaction.reply({
            content: "Đã tạo tài khoản thành công!\nChúc bạn may mắn trên con đường trở thành vua cày cuốc :)"
        })
    }
} satisfies Command;