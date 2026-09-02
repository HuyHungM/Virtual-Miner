import mongoose from 'mongoose';
import { MessageFlags } from 'discord.js';

import type { ButtonRoute } from '../types';
import { executeShopBackpacks } from '../../commands/shop';
import { getUserOrReply } from '../../shared/discord/interaction';
import { buyBackpack } from '../../modules/equipment/BackpackShopService';

export const backpackRoutes: ButtonRoute[] = [
    {
        prefix: 'backpack:buy:',
        handle: async (client, interaction) => {
            const parts = interaction.customId.split(':');
            const backpackId = parts[2];
            const page = Number(parts[3] ?? 0);

            if (!backpackId) {
                await interaction.reply({
                    content: 'Không tìm thấy ba lô này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const user = await getUserOrReply(client, interaction);
            if (!user) return;

            const backpack = client.resources.backpacks.get(backpackId);
            if (!backpack) {
                await interaction.reply({
                    content: 'Không tìm thấy ba lô này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    await buyBackpack(client, user.userId, backpackId, session);
                });

                await executeShopBackpacks(client, interaction, page);
            } catch (error) {
                console.error(error);
                let content = 'Đã xảy ra lỗi khi mua ba lô.';
                if (error instanceof Error) {
                    switch (error.message) {
                        case 'INSUFFICIENT_BALANCE':
                            content = 'Bạn không đủ tiền để mua ba lô này.';
                            break;
                        case 'BIOME_LOCKED':
                            content = 'Vùng này chưa được mở khoá ba lô.';
                            break;
                        case 'PREVIOUS_BIOME_REQUIRED':
                            content =
                                'Bạn cần mua đủ 4 ba lô của vùng trước để mở khoá vùng này.';
                            break;
                        case 'PREVIOUS_TIER_REQUIRED':
                            content =
                                'Bạn cần mua ba lô tầng trước trước khi mua tầng này.';
                            break;
                        case 'ALREADY_OWNED':
                            content = 'Bạn đã sở hữu ba lô này.';
                            break;
                    }
                }
                await interaction.reply({
                    content,
                    flags: MessageFlags.Ephemeral,
                });
            } finally {
                await session.endSession();
            }
        },
    },
];
