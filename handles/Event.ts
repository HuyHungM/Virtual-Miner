import type { Client } from 'discord.js';

import { events } from '../events/manifest';

export default async (client: Client) => {
    for (const event of events) {
        if (typeof event === 'function') {
            console.log('[EVENT] Đã tải một sự kiện');
            event(client);
        }
    }
};
