import type { ButtonRoute } from '../types';

import { executeMine } from '../../commands/mine';
import { executeSell } from '../../commands/sell';
import { executeMenu } from '../../commands/menu';

export const miningRoutes: ButtonRoute[] = [
    {
        id: 'mining:continue',
        handle: async (client, interaction) => {
            await executeMine(client, interaction);
        },
    },
    {
        id: 'mining:sell',
        handle: async (client, interaction) => {
            await executeSell(client, interaction);
        },
    },
    {
        id: 'mining:menu',
        handle: async (client, interaction) => {
            await executeMenu(client, interaction);
        },
    },
];
