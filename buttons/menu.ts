import type { ButtonRoute } from './types';
import { executeMenu } from '../commands/menu';
import { executeProfileTab } from '../commands/profile';
import { executePets } from '../commands/pets';
import { executeShopMenu } from '../commands/shop';
import { executeBiome } from '../commands/biome';
import { executeQuest } from '../commands/quest';
import { executeDaily } from '../commands/daily';

async function runSlashCommand(
    client: Parameters<typeof executeMenu>[0],
    interaction: Parameters<typeof executeMenu>[1],
    name: string,
) {
    const cmd = client.commands.get(name);

    if (cmd) await cmd.run(client, interaction);
}

export const menuRoutes: ButtonRoute[] = [
    {
        id: 'menu:back',
        handle: async (client, interaction) => {
            await executeMenu(client, interaction);
        },
    },
    {
        id: 'menu:mine',
        handle: async (client, interaction) => {
            await runSlashCommand(client, interaction, 'mine');
        },
    },
    {
        id: 'menu:sell',
        handle: async (client, interaction) => {
            await runSlashCommand(client, interaction, 'sell');
        },
    },
    {
        id: 'menu:profile',
        handle: async (client, interaction) => {
            await executeProfileTab(client, interaction, 'inv');
        },
    },
    {
        id: 'menu:pets',
        handle: async (client, interaction) => {
            await executePets(client, interaction, 'owned', 0);
        },
    },
    {
        id: 'menu:shop',
        handle: async (client, interaction) => {
            await executeShopMenu(client, interaction);
        },
    },
    {
        id: 'menu:biome',
        handle: async (client, interaction) => {
            await executeBiome(client, interaction);
        },
    },
    {
        id: 'menu:quest',
        handle: async (client, interaction) => {
            await executeQuest(client, interaction);
        },
    },
    {
        id: 'menu:daily',
        handle: async (client, interaction) => {
            await executeDaily(client, interaction);
        },
    },
];
