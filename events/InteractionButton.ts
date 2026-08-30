import { Events, MessageFlags, type Client } from 'discord.js';
import { executeShop } from '../commands/shop';

export default async (client: Client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isButton()) {
            return;
        }

        if (interaction.customId === 'mine:again') {
            const mine = client.commands.get('mine');

            if (!mine) {
                return;
            }

            await mine.run(client, interaction);

            return;
        }

        if (interaction.customId === 'mine:sell') {
            const sell = client.commands.get('sell');

            if (!sell) {
                return;
            }

            await sell.run(client, interaction);

            return;
        }

        if (interaction.customId.startsWith('shop:prev:')) {
            const page = Number(interaction.customId.split(':')[2]);

            await executeShop(client, interaction, page - 1);

            return;
        }

        if (interaction.customId.startsWith('shop:next:')) {
            const page = Number(interaction.customId.split(':')[2]);

            await executeShop(client, interaction, page + 1);

            return;
        }

        if (interaction.customId.startsWith('shop:select:')) {
            const pickaxeId = interaction.customId.split(':')[2];

            if (!pickaxeId) {
                await interaction.reply({
                    content: 'Không tìm thấy cây cúp này.',
                    flags: MessageFlags.Ephemeral,
                });

                return;
            }

            const pickaxe = client.resources.pickaxes.get(pickaxeId);

            if (!pickaxe) {
                await interaction.reply({
                    content: 'Không tìm thấy cây cúp này.',
                    flags: MessageFlags.Ephemeral,
                });

                return;
            }

            await interaction.reply({
                content: `⛏️ Bạn đã chọn **${pickaxe.name}**.`,
                flags: MessageFlags.Ephemeral,
            });

            return;
        }
    });
};
