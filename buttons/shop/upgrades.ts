import mongoose from 'mongoose';
import { MessageFlags } from 'discord.js';

import type { ButtonRoute } from '../types';
import { executeShopUpgrades } from '../../commands/shop';
import { getUserOrReply } from '../../shared/discord/interaction';
import { incrementUpgrade } from '../../modules/user/UserService';
import { updateBalance } from '../../modules/economy/BalanceService';
import {
    UPGRADE_DEFS,
    getUpgradeCost,
    getUpgradeProgress,
} from '../../modules/upgrade/UpgradeShopService';

export const upgradeRoutes: ButtonRoute[] = [
    {
        prefix: 'upgrade:buy:',
        handle: async (client, interaction) => {
            const stat = interaction.customId.split(':')[2];

            if (!stat) {
                await interaction.reply({
                    content: 'Không tìm thấy nâng cấp này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const def = UPGRADE_DEFS.find((u) => u.id === stat);

            if (!def) {
                await interaction.reply({
                    content: 'Không tìm thấy nâng cấp này.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const user = await getUserOrReply(client, interaction);
            if (!user) return;

            const currentLevel = getUpgradeProgress(user, def);

            if (currentLevel >= def.maxLevel) {
                await interaction.reply({
                    content: 'Nâng cấp này đã đạt cấp tối đa.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const cost = getUpgradeCost(def, currentLevel);

            if (user.balance < cost) {
                await interaction.reply({
                    content: `Bạn không đủ tiền. Cần **$${cost.toLocaleString()}**.`,
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

            const session = await mongoose.startSession();

            try {
                await session.withTransaction(async () => {
                    await updateBalance(user.userId, -cost, session);
                    await incrementUpgrade(user.userId, def.stat, session);
                });

                await executeShopUpgrades(client, interaction, 0);
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: 'Đã xảy ra lỗi khi nâng cấp.',
                    flags: MessageFlags.Ephemeral,
                });
            } finally {
                await session.endSession();
            }
        },
    },
];
