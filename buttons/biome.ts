import mongoose from 'mongoose';
import { MessageFlags } from 'discord.js';

import type { ButtonRoute } from './types';
import { executeBiome } from '../commands/biome';
import { getUser, unlockBiome, setBiome } from '../modules/user/UserService';
import { getUserOrReply } from '../shared/discord/interaction';

export const biomeRoutes: ButtonRoute[] = [
    {
        prefix: 'biome:switch:',
        handle: async (client, interaction) => {
            const biomeId = interaction.customId.split(':')[2];

            if (!biomeId) {
                await interaction.reply({
                    content: 'Không tìm thấy vùng đất này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const biome = client.resources.biomes.get(biomeId);

            if (!biome) {
                await interaction.reply({
                    content: 'Không tìm thấy vùng đất này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const user = await getUserOrReply(client, interaction);

            if (!user) return;

            if (user.level < biome.unlock_level) {
                await interaction.reply({
                    content: `Bạn cần đạt **Lv.${biome.unlock_level}** để mở vùng này.`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    await unlockBiome(user.userId, biomeId, session);
                    await setBiome(user.userId, biomeId, session);
                });

                await executeBiome(client, interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: 'Đã xảy ra lỗi khi di chuyển vùng.',
                    flags: MessageFlags.Ephemeral,
                });
            } finally {
                await session.endSession();
            }
        },
    },
];
