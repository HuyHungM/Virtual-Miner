import type { Client } from 'discord.js';
import type { Pickaxe } from '../../types/Pickaxe';

export const PICKAXES_PER_PAGE = 5;

export function getShopPickaxes(client: Client, userLevel: number): Pickaxe[] {
    return [...client.resources.pickaxes.values()]
        .sort((a, b) => a.price - b.price)
        .filter((pickaxe) => pickaxe.unlock_level <= userLevel);
}

export function getNextShopLevel(client: Client, userLevel: number) {
    return (
        [...client.resources.pickaxes.values()]
            .sort((a, b) => a.price - b.price)
            .find((pickaxe) => pickaxe.unlock_level > userLevel)
            ?.unlock_level ?? null
    );
}

export function getShopPage(
    client: Client,
    userLevel: number,
    pickaxeId: string,
    page: number,
) {
    const pickaxes = getShopPickaxes(client, userLevel);

    const currentPickaxe = client.resources.pickaxes.get(pickaxeId);

    const totalPages = Math.max(
        1,
        Math.ceil(pickaxes.length / PICKAXES_PER_PAGE),
    );

    const currentPage = Math.max(0, Math.min(page, totalPages - 1));

    const start = currentPage * PICKAXES_PER_PAGE;

    return {
        pickaxes: pickaxes.slice(start, start + PICKAXES_PER_PAGE),
        currentPickaxe,
        page: currentPage,
        totalPages,
    };
}
