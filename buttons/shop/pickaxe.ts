import mongoose from 'mongoose';
import { MessageFlags } from 'discord.js';

import type { ButtonRoute } from '../types';
import { executeShop } from '../../commands/shop';
import { getUserOrReply } from '../../shared/discord/interaction';
import {
    getUser,
    addUnlockedPickaxe,
    equipPickaxe,
} from '../../modules/user/UserService';
import { updateBalance } from '../../modules/economy/BalanceService';

export const pickaxeRoutes: ButtonRoute[] = [
    {
        prefix: 'shop:select:',
        handle: async (client, interaction) => {
            const pickaxeId = interaction.customId.split(':')[2];

            if (!pickaxeId) {
                await interaction.reply({
                    content: 'Không tìm thấy cây cúp này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const page = Math.max(
                0,
                Number(interaction.customId.split(':')[3] ?? 0),
            );

            const pickaxe = client.resources.pickaxes.get(pickaxeId);

            if (!pickaxe) {
                await interaction.reply({
                    content: 'Không tìm thấy cây cúp này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const user = await getUserOrReply(client, interaction);
            if (!user) return;

            const owned = user.unlocked_pickaxes.includes(pickaxeId);
            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    if (owned) {
                        if (user.pickaxe === pickaxeId) return;

                        await equipPickaxe(user.userId, pickaxeId, session);
                        return;
                    }

                    const fresh = await getUser(user.userId, session);

                    if (fresh!.balance < pickaxe.price) {
                        throw new Error('INSUFFICIENT_BALANCE');
                    }

                    await updateBalance(user.userId, -pickaxe.price, session);
                    await addUnlockedPickaxe(user.userId, pickaxeId, session);
                });

                await executeShop(client, interaction, page);
            } catch (error: any) {
                if (error?.message === 'INSUFFICIENT_BALANCE') {
                    await interaction.reply({
                        content: 'Bạn không đủ tiền để mua cây cúp này.',
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }

                console.error(error);
                await interaction.reply({
                    content: 'Đã xảy ra lỗi khi mua cây cúp.',
                    flags: MessageFlags.Ephemeral,
                });
            } finally {
                await session.endSession();
            }
        },
    },
];
