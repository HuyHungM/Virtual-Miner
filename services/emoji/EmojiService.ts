import type { ButtonBuilder, Client } from 'discord.js';

export const EMOJI_MONEY = '1544021198185308331';
export const EMOJI_XP = '1544021194926194749';
export const EMOJI_GEM = '1544021192493502645';
export const EMOJI_CHEST = '1544021417601933353';
export const EMOJI_PET = '1544022336217546752';

export const EMOJI_ENDERCHEST = '1544212883163054170';
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
export const EMOJI_GIFT = '1544026466977583170'; // placeholder — replace with real app emoji
export const EMOJI_QUEST = '1544026466977583171'; // placeholder — replace with real app emoji
// export const EMOJI_ARROW_LEFT = '1544216364577857587';
// export const EMOJI_ARROW_RIGHT = '1544216361746694165';

// Treasure Chest Trap emojis (placeholder IDs — replace with real app emojis)
export const EMOJI_TRAP = '1544263884834344980';
export const EMOJI_STUN = '1544263527479517204';
export const EMOJI_SLOW = '1544263667032522873';
export const EMOJI_PIGLIN = '1544263373976244296';
export const EMOJI_MILK = '1544340229828251748';
export const EMOJI_COMBAT = '1544266402146295808';
export const EMOJI_RESIST = '1544264019206996070';
export const EMOJI_BACKPACK = '1544264168847315006';
export const EMOJI_HP = '1544262974037037097';
export const EMOJI_ATK = '1544262971780239451';
export const EMOJI_DEF = '1544262975991586917';

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
