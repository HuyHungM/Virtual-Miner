import { Events, type Client } from "discord.js";

export default async (client : Client) => {
    client.on(Events.InteractionCreate, async (interaction) => {

        if (!interaction.isChatInputCommand()) return;

        const cmd = client.commands.get(interaction.commandName);

        if (!cmd) return;

        await cmd.run(client, interaction);
    })
}