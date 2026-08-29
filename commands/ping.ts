import type { Command } from "../types/Command"

export default {
    name: "ping",
    description: "ping!!",
    run: async (client, interaction) => {
        await interaction.reply("Ping pongg")
    }
} satisfies Command;