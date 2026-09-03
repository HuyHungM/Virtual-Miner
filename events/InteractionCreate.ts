import { Events, type Client } from 'discord.js';

import { replyV2Error } from '../shared/discord/interaction';

export default async (client: Client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const cmd = client.commands.get(interaction.commandName);

        if (!cmd) return;

        try {
            await cmd.run(client, interaction);
        } catch (error) {
            console.error(
                `Command "${interaction.commandName}" failed:`,
                error,
            );

            await replyV2Error(
                interaction,
                'Đã xảy ra lỗi khi thực hiện lệnh. Vui lòng thử lại.',
            );
        }
    });
};
