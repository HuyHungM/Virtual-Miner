import type { ButtonRoute } from './types';
import { executeProfileTab } from '../commands/profile';

export const profileRoutes: ButtonRoute[] = [
    {
        prefix: 'profile:inv:',
        handle: async (client, interaction) => {
            const target = interaction.customId.split(':')[2];
            await executeProfileTab(client, interaction, 'inv', target);
        },
    },
    {
        prefix: 'profile:stats:',
        handle: async (client, interaction) => {
            const target = interaction.customId.split(':')[2];
            await executeProfileTab(client, interaction, 'stats', target);
        },
    },
    {
        prefix: 'profile:hist:',
        handle: async (client, interaction) => {
            const target = interaction.customId.split(':')[2];
            await executeProfileTab(client, interaction, 'hist', target);
        },
    },
    {
        prefix: 'profile:charms:',
        handle: async (client, interaction) => {
            const target = interaction.customId.split(':')[2];
            await executeProfileTab(client, interaction, 'charms', target);
        },
    },
];
