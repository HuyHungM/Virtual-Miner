import mongoose from 'mongoose';
import { Events, MessageFlags, type Client } from 'discord.js';

import {
    executeShop,
    executeShopMenu,
    executeShopBoosts,
    executeShopUpgrades,
    getUserOrReply,
} from '../commands/shop';
import { executeBiome } from '../commands/biome';
import { executeProfileTab } from '../commands/profile';
import { executePets } from '../commands/pets';
import { hasActiveBoost } from '../services/shop/BoostShopService';

const MINUTE_MS = 60 * 1000;

export default async (client: Client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isButton()) {
            return;
        }

        const customId = interaction.customId;

        // ---- Mine flow ----
        if (customId === 'mine:again') {
            const mine = client.commands.get('mine');
            if (mine) await mine.run(client, interaction);
            return;
        }

        if (customId === 'mine:sell') {
            const sell = client.commands.get('sell');
            if (sell) await sell.run(client, interaction);
            return;
        }

        // ---- Shop menu ----
        if (customId === 'shop:menu') {
            await executeShopMenu(client, interaction);
            return;
        }

        if (customId === 'shop:pickaxe') {
            await executeShop(client, interaction, 0);
            return;
        }

        if (customId === 'shop:boost') {
            await executeShopBoosts(client, interaction, 0);
            return;
        }

        if (customId === 'shop:upgrade') {
            await executeShopUpgrades(client, interaction, 0);
            return;
        }

        // ---- Biome switch ----
        if (customId.startsWith('biome:switch:')) {
            await handleBiomeSwitch(client, interaction);
            return;
        }

        // ---- Pickaxe pagination ----
        if (customId.startsWith('shop:prev:')) {
            const page = Number(customId.split(':')[2]);
            await executeShop(client, interaction, page - 1);
            return;
        }

        if (customId.startsWith('shop:next:')) {
            const page = Number(customId.split(':')[2]);
            await executeShop(client, interaction, page + 1);
            return;
        }

        // ---- Upgrade pagination ----
        if (customId.startsWith('upgrade:prev:')) {
            const page = Number(customId.split(':')[2]);
            await executeShopUpgrades(client, interaction, page - 1);
            return;
        }

        if (customId.startsWith('upgrade:next:')) {
            const page = Number(customId.split(':')[2]);
            await executeShopUpgrades(client, interaction, page + 1);
            return;
        }

        // ---- Boost pagination ----
        if (customId.startsWith('boost:prev:')) {
            const page = Number(customId.split(':')[2]);
            await executeShopBoosts(client, interaction, page - 1);
            return;
        }

        if (customId.startsWith('boost:next:')) {
            const page = Number(customId.split(':')[2]);
            await executeShopBoosts(client, interaction, page + 1);
            return;
        }

        // ---- Pickaxe purchase / equip ----
        if (customId.startsWith('shop:select:')) {
            await handlePickaxeSelect(client, interaction);
            return;
        }

        // ---- Boost purchase ----
        if (customId.startsWith('boost:buy:')) {
            await handleBoostBuy(client, interaction);
            return;
        }

        // ---- Upgrade purchase ----
        if (customId.startsWith('upgrade:buy:')) {
            await handleUpgradeBuy(client, interaction);
            return;
        }

        // ---- Pet equip/unequip ----
        if (customId === 'pet:unequip') {
            await handlePetUnequip(client, interaction);
            return;
        }

        if (customId.startsWith('pet:equip:') || customId.startsWith('pet:info:')) {
            if (customId.startsWith('pet:equip:')) {
                await handlePetEquip(client, interaction);
            }
            return;
        }

        if (customId.startsWith('pet:collection:')) {
            const page = Number(customId.split(':')[2] ?? 0);
            await executePets(client, interaction, 'collection', page);
            return;
        }

        if (customId.startsWith('pet:owned:')) {
            const page = Number(customId.split(':')[2] ?? 0);
            await executePets(client, interaction, 'owned', page);
            return;
        }

        if (customId.startsWith('pet:prev:')) {
            const tab = customId.split(':')[2] as 'collection' | 'owned';
            const page = Number(customId.split(':')[3] ?? 0);
            await executePets(client, interaction, tab, page - 1);
            return;
        }

        if (customId.startsWith('pet:next:')) {
            const tab = customId.split(':')[2] as 'collection' | 'owned';
            const page = Number(customId.split(':')[3] ?? 0);
            await executePets(client, interaction, tab, page + 1);
            return;
        }

        // ---- Profile tabs ----
        if (customId.startsWith('profile:inv:')) {
            const target = customId.split(':')[2];
            await executeProfileTab(client, interaction, 'inv', target);
            return;
        }

        if (customId.startsWith('profile:stats:')) {
            const target = customId.split(':')[2];
            await executeProfileTab(client, interaction, 'stats', target);
            return;
        }

        if (customId.startsWith('profile:hist:')) {
            const target = customId.split(':')[2];
            await executeProfileTab(client, interaction, 'hist', target);
            return;
        }
    });
};

async function handleBiomeSwitch(client: Client, interaction: any) {
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

    const { getUser, unlockBiome, setBiome } =
        await import('../services/user/UserService');

    const user = await getUser(interaction.user.id);

    if (!user) {
        await interaction.reply({
            content:
                'Bạn chưa tạo tài khoản.\n' +
                '`/start` để bắt đầu hành trình cày cuốc của bạn.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

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
}

async function handlePickaxeSelect(client: Client, interaction: any) {
    const pickaxeId = interaction.customId.split(':')[2];

    if (!pickaxeId) {
        await interaction.reply({
            content: 'Không tìm thấy cây cúp này.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const page = Math.max(0, Number(interaction.customId.split(':')[3] ?? 0));

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
            const { getUser, updateBalance, addUnlockedPickaxe, equipPickaxe } =
                await import('../services/user/UserService');

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
}

async function handleBoostBuy(client: Client, interaction: any) {
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

    const { getUser, updateGems, addActiveBoost } =
        await import('../services/user/UserService');

    const user = await getUser(interaction.user.id);
    if (!user) {
        await interaction.reply({
            content:
                'Bạn chưa tạo tài khoản.\n' +
                '`/start` để bắt đầu hành trình cày cuốc của bạn.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

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
}

async function handleUpgradeBuy(client: Client, interaction: any) {
    const stat = interaction.customId.split(':')[2];

    if (!stat) {
        await interaction.reply({
            content: 'Không tìm thấy nâng cấp này.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const { getUser, updateBalance, incrementUpgrade } =
        await import('../services/user/UserService');
    const { UPGRADE_DEFS, getUpgradeCost, getUpgradeProgress } =
        await import('../services/shop/UpgradeShopService');

    const def = UPGRADE_DEFS.find((u) => u.id === stat);

    if (!def) {
        await interaction.reply({
            content: 'Không tìm thấy nâng cấp này.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const user = await getUser(interaction.user.id);
    if (!user) {
        await interaction.reply({
            content:
                'Bạn chưa tạo tài khoản.\n' +
                '`/start` để bắt đầu hành trình cày cuốc của bạn.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

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
}

async function handlePetEquip(client: Client, interaction: any) {
    const petId = interaction.customId.split(':')[2];

    if (!petId) {
        await interaction.reply({
            content: 'Không tìm thấy thú cưng này.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const petDef = client.resources.pets.get(petId);

    if (!petDef) {
        await interaction.reply({
            content: 'Không tìm thấy thú cưng này.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const user = await getUserOrReply(client, interaction);
    if (!user) return;

    const owned = user.pets?.some((p: any) => p.petId === petId);

    if (!owned) {
        await interaction.reply({
            content: 'Bạn chưa sở hữu thú cưng này.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const { equipPet } = await import('../services/user/UserService');

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            await equipPet(user.userId, petId, session);
        });

        await executePets(client, interaction, 'owned', 0);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'Đã xảy ra lỗi khi trang bị thú cưng.',
            flags: MessageFlags.Ephemeral,
        });
    } finally {
        await session.endSession();
    }
}

async function handlePetUnequip(client: Client, interaction: any) {
    const user = await getUserOrReply(client, interaction);
    if (!user) return;

    if (!user.equippedPet) {
        await interaction.reply({
            content: 'Bạn chưa trang bị thú cưng nào.',
            flags: MessageFlags.Ephemeral,
        });
        return;
    }

    const { unequipPet } = await import('../services/user/UserService');

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            await unequipPet(user.userId, session);
        });

        await executePets(client, interaction, 'owned', 0);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'Đã xảy ra lỗi khi bỏ trang bị thú cưng.',
            flags: MessageFlags.Ephemeral,
        });
    } finally {
        await session.endSession();
    }
}
