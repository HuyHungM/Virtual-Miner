import { Events, type Client } from 'discord.js';

import { dispatchButton } from '../buttons';

export default async (client: Client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isButton()) {
            return;
        }

        await dispatchButton(client, interaction);
    });
};
