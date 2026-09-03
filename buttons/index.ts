import type { Client, ButtonInteraction } from 'discord.js';

import type { ButtonRoute } from './types';
import { menuRoutes } from './menu';
import { biomeRoutes } from './biome';
import { petsRoutes } from './pets';
import { profileRoutes } from './profile';
import { shopRoutes } from './shop';
import { miningRoutes } from './mining';

const BUTTON_ROUTES: ButtonRoute[] = [
    ...menuRoutes,
    ...shopRoutes,
    ...biomeRoutes,
    ...petsRoutes,
    ...profileRoutes,
    ...miningRoutes,
];

export async function dispatchButton(
    client: Client,
    interaction: ButtonInteraction,
): Promise<void> {
    const customId = interaction.customId;

    for (const route of BUTTON_ROUTES) {
        const matches =
            route.id !== undefined
                ? customId === route.id
                : customId.startsWith(route.prefix!);

        if (!matches) continue;

        await route.handle(client, interaction);
        return;
    }
}
