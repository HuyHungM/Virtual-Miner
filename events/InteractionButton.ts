import {
    Events,
    type Client,
} from "discord.js";

import User from "../models/User";

import {
    sellAll,
} from "../services/sell/SellService";

import {
    getUpgradeStats,
} from "../services/upgrade/UpgradeService";

export default async (
    client: Client,
) => {
    client.on(
        Events.InteractionCreate,
        async interaction => {
            if (
                !interaction.isButton()
            ) {
                return;
            }

            if (
                interaction.customId ===
                "mine:again"
            ) {
                const mine =
                    client.commands.get(
                        "mine",
                    );

                if (!mine) {
                    return;
                }

                await mine.run(
                    client,
                    interaction,
                );

                return;
            }

            if (
                interaction.customId ===
                "mine:sell"
            ) {
                const sell =
                    client.commands.get(
                        "sell",
                    );

                if (!sell) {
                    return;
                }

                await sell.run(
                    client,
                    interaction,
                );

                return;
            }
        },
    );
};
