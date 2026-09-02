import type { ButtonRoute } from '../types';
import {
    executeShop,
    executeShopMenu,
    executeShopBoosts,
    executeShopUpgrades,
    executeShopBackpacks,
} from '../../commands/shop';

export const shopNavigationRoutes: ButtonRoute[] = [
    {
        id: 'shop:menu',
        handle: async (client, interaction) => {
            await executeShopMenu(client, interaction);
        },
    },
    {
        id: 'shop:pickaxe',
        handle: async (client, interaction) => {
            await executeShop(client, interaction, 0);
        },
    },
    {
        id: 'shop:boost',
        handle: async (client, interaction) => {
            await executeShopBoosts(client, interaction, 0);
        },
    },
    {
        id: 'shop:upgrade',
        handle: async (client, interaction) => {
            await executeShopUpgrades(client, interaction, 0);
        },
    },
    {
        id: 'shop:backpack',
        handle: async (client, interaction) => {
            await executeShopBackpacks(client, interaction, 0);
        },
    },
    {
        prefix: 'shop:prev:',
        handle: async (client, interaction) => {
            const page = Number(interaction.customId.split(':')[2]);
            await executeShop(client, interaction, page - 1);
        },
    },
    {
        prefix: 'shop:next:',
        handle: async (client, interaction) => {
            const page = Number(interaction.customId.split(':')[2]);
            await executeShop(client, interaction, page + 1);
        },
    },
    {
        prefix: 'upgrade:prev:',
        handle: async (client, interaction) => {
            const page = Number(interaction.customId.split(':')[2]);
            await executeShopUpgrades(client, interaction, page - 1);
        },
    },
    {
        prefix: 'upgrade:next:',
        handle: async (client, interaction) => {
            const page = Number(interaction.customId.split(':')[2]);
            await executeShopUpgrades(client, interaction, page + 1);
        },
    },
    {
        prefix: 'boost:prev:',
        handle: async (client, interaction) => {
            const page = Number(interaction.customId.split(':')[2]);
            await executeShopBoosts(client, interaction, page - 1);
        },
    },
    {
        prefix: 'boost:next:',
        handle: async (client, interaction) => {
            const page = Number(interaction.customId.split(':')[2]);
            await executeShopBoosts(client, interaction, page + 1);
        },
    },
    {
        prefix: 'backpack:prev:',
        handle: async (client, interaction) => {
            const page = Number(interaction.customId.split(':')[2]);
            await executeShopBackpacks(client, interaction, page - 1);
        },
    },
    {
        prefix: 'backpack:next:',
        handle: async (client, interaction) => {
            const page = Number(interaction.customId.split(':')[2]);
            await executeShopBackpacks(client, interaction, page + 1);
        },
    },
];
