import type { Client } from "discord.js";
import { readdirSync } from "fs"
import { join } from "path"

export default async (client : Client) => {
    const files = readdirSync(join(".", ".", "events"));

    for (const name of files) {
        if (!name.endsWith(".ts")) continue;
        
        const event = await import(`../events/${name}`);

        if (typeof event.default === "function") {
            console.log(`[EVENT] Đã tải ${name}`)
            event.default(client);
        }
    }
}