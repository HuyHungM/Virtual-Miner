import { Collection, Events } from 'discord.js';

export default async (client: any) => {
    client.once(Events.ClientReady, async () => {
        console.log(`${client.user.username} đã online!`);
        const emojis = await client.application!.emojis.fetch();

        client.appEmojis = new Collection();

        for (const emoji of emojis.values()) {
            client.appEmojis.set(emoji.id, emoji.toString());
        }

        console.log(`[EMOJI] Đã tải ${client.appEmojis.size} emoji`);
    });
};
