import type { ButtonBuilder, Client } from 'discord.js';

export const EMOJI_MONEY = '1544021198185308331';
export const EMOJI_XP = '1544021194926194749';
export const EMOJI_GEM = '1544021192493502645';
export const EMOJI_CHEST = '1544021417601933353';
export const EMOJI_PET = '1544022336217546752';

export const EMOJI_PICKAXE = '1543189932074336307';
export const EMOJI_FORTUNE = '1544024791005003796';
export const EMOJI_UPGRADE = '1544025243889434815';
export const EMOJI_POTION = '1544028973174890508';
export const EMOJI_GOLD_INGOT = '1544029506698874882';
export const EMOJI_SHOP = '1544024934488088706';
export const EMOJI_MAP = '1544025351775330335';
export const EMOJI_CLOCK = '1544025449699483708';
export const EMOJI_LEVEL_UP = '1544025596315566291';
export const EMOJI_INVENTORY = '1544025861190193232';
export const EMOJI_GLOBE = '1544026225171894353';
export const EMOJI_CHECK = '1544026466977583165';
export const EMOJI_ARROW_LEFT = 'PLACEHOLDER_ARROW_LEFT';
export const EMOJI_ARROW_RIGHT = 'PLACEHOLDER_ARROW_RIGHT';

export function getEmoji(client: Client, id: string): string {
    return client.appEmojis.get(id) ?? '';
}

export function setButtonEmoji(
    button: ButtonBuilder,
    client: Client,
    emojiId: string,
): ButtonBuilder {
    const emoji = getEmoji(client, emojiId);
    if (emoji) {
        button.setEmoji(emoji);
    }
    return button;
}
