import { Events, type Client } from 'discord.js';

import { dispatchButton } from '../buttons';
import { replyV2Error } from '../shared/discord/interaction';

export default async (client: Client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isButton()) {
            return;
        }

        try {
            await dispatchButton(client, interaction);
        } catch (error) {
            console.error(`Button "${interaction.customId}" failed:`, error);

            await replyV2Error(
                interaction,
                'Đã xảy ra lỗi khi thực hiện thao tác này.',
            );
        }
    });
};
