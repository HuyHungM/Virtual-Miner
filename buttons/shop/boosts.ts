import mongoose from 'mongoose';
import { MessageFlags } from 'discord.js';

import type { ButtonRoute } from '../types';
import { executeShopBoosts } from '../../commands/shop';
import { getUserOrReply } from '../../shared/discord/interaction';
import { addActiveBoost } from '../../modules/user/UserService';
import { updateGems } from '../../modules/economy/BalanceService';
import { hasActiveBoost } from '../../modules/boost/BoostShopService';
import {
    getPotionPrice,
    buyAndUsePotion,
} from '../../modules/boost/PotionShopService';

const MINUTE_MS = 60 * 1000;

export const boostRoutes: ButtonRoute[] = [
    {
        prefix: 'boost:buy:',
        handle: async (client, interaction) => {
            const boostId = interaction.customId.split(':')[2];

            if (!boostId) {
                await interaction.reply({
                    content: 'Không tìm thấy thuốc này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const boost = client.resources.boosts.get(boostId);

            if (!boost) {
                await interaction.reply({
                    content: 'Không tìm thấy thuốc này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const user = await getUserOrReply(client, interaction);
            if (!user) return;

            if (user.gems < boost.price) {
                await interaction.reply({
                    content: 'Bạn không đủ gem để mua thuốc này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const active = hasActiveBoost(user, boost.boostId);

            if (active) {
                await interaction.reply({
                    content: `**${boost.name}** đang hoạt động. Bạn phải đợi thuốc này hết hạn trước khi mua lại.`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    await updateGems(user.userId, -boost.price, session);
                    await addActiveBoost(
                        user.userId,
                        {
                            boostId: boost.boostId,
                            expiresAt: new Date(
                                Date.now() + boost.duration * MINUTE_MS,
                            ),
                        },
                        session,
                    );
                });

                await executeShopBoosts(
                    client,
                    interaction,
                    boost.duration === 30 ? 1 : 0,
                );
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: 'Đã xảy ra lỗi khi mua thuốc.',
                    flags: MessageFlags.Ephemeral,
                });
            } finally {
                await session.endSession();
            }
        },
    },
    {
        prefix: 'potion:buy:',
        handle: async (client, interaction) => {
            const potionId = interaction.customId.split(':')[2];

            if (!potionId) {
                await interaction.reply({
                    content: 'Không tìm thấy loại thuốc này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const potion = client.resources.potions.get(potionId);

            if (!potion) {
                await interaction.reply({
                    content: 'Không tìm thấy loại thuốc này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const user = await getUserOrReply(client, interaction);
            if (!user) return;

            const price = getPotionPrice(potion.id, user.level);

            if (user.gems < price) {
                await interaction.reply({
                    content: 'Bạn không đủ gem để mua loại thuốc này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    await buyAndUsePotion(
                        user.userId,
                        user.level,
                        potion.id,
                        session,
                    );
                });

                await executeShopBoosts(client, interaction, 0);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content:
                        'Không thể mua thuốc ngay lúc này. Kiểm tra lại trạng thái hiệu ứng của bạn.',
                    flags: MessageFlags.Ephemeral,
                });
            } finally {
                await session.endSession();
            }
        },
    },
];
