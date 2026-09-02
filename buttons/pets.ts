import mongoose from 'mongoose';
import { MessageFlags } from 'discord.js';

import type { ButtonRoute } from './types';
import { executePets } from '../commands/pets';
import { getUserOrReply } from '../shared/discord/interaction';
import { equipPet, unequipPet } from '../modules/pet/PetService';

export const petsRoutes: ButtonRoute[] = [
    {
        id: 'pet:unequip',
        handle: async (client, interaction) => {
            const user = await getUserOrReply(client, interaction);
            if (!user) return;

            if (!user.equippedPet) {
                await interaction.reply({
                    content: 'Bạn chưa trang bị thú cưng nào.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }

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
        },
    },
    {
        prefix: 'pet:equip:',
        handle: async (client, interaction) => {
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
        },
    },
    {
        prefix: 'pet:info:',
        handle: async () => {
            // Reserved info route — no action.
        },
    },
    {
        prefix: 'pet:collection:',
        handle: async (client, interaction) => {
            const page = Number(interaction.customId.split(':')[2] ?? 0);
            await executePets(client, interaction, 'collection', page);
        },
    },
    {
        prefix: 'pet:owned:',
        handle: async (client, interaction) => {
            const page = Number(interaction.customId.split(':')[2] ?? 0);
            await executePets(client, interaction, 'owned', page);
        },
    },
    {
        prefix: 'pet:prev:',
        handle: async (client, interaction) => {
            const tab = interaction.customId.split(':')[2] as
                'collection' | 'owned';
            const page = Number(interaction.customId.split(':')[3] ?? 0);
            await executePets(client, interaction, tab, page - 1);
        },
    },
    {
        prefix: 'pet:next:',
        handle: async (client, interaction) => {
            const tab = interaction.customId.split(':')[2] as
                'collection' | 'owned';
            const page = Number(interaction.customId.split(':')[3] ?? 0);
            await executePets(client, interaction, tab, page + 1);
        },
    },
];
