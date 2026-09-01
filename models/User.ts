import mongoose, { Schema } from 'mongoose';

import { MAX_SAFE_MONEY, MAX_SAFE_XP } from '../services/balance/BalanceConfig';

const UserSchema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        level: {
            type: Number,
            default: 1,
            min: 1,
        },
        xp: {
            type: Number,
            default: 0,
            min: 0,
            max: MAX_SAFE_XP,
        },
        balance: {
            type: Number,
            default: 0,
            min: 0,
            max: MAX_SAFE_MONEY,
        },
        gems: {
            type: Number,
            default: 0,
            min: 0,
        },
        color: {
            type: String,
            required: true,
            default: '#00a6ff',
        },
        pickaxe: {
            type: String,
            required: true,
            default: 'wooden_pickaxe',
        },
        biome: {
            type: String,
            required: true,
            default: 'plains',
        },
        unlocked_pickaxes: {
            type: [String],
            default: ['wooden_pickaxe'],
        },

        unlocked_biomes: {
            type: [String],
            default: ['plains'],
        },
        upgrades: {
            effective: {
                type: Number,
                default: 0,
                min: 0,
            },
            fortune: {
                type: Number,
                default: 0,
                min: 0,
            },
            sell_price: {
                type: Number,
                default: 0,
                min: 0,
            },
            xp_multiplier: {
                type: Number,
                default: 0,
                min: 0,
            },
            chest_chance: {
                type: Number,
                default: 0,
                min: 0,
            },
            chest_quality: {
                type: Number,
                default: 0,
                min: 0,
            },
        },
        active_boosts: {
            type: [
                {
                    boostId: {
                        type: String,
                        required: true,
                    },
                    expiresAt: {
                        type: Date,
                        required: true,
                    },
                },
            ],
            default: [],
        },
        pets: {
            type: [
                {
                    petId: {
                        type: String,
                        required: true,
                    },
                    level: {
                        type: Number,
                        default: 1,
                        min: 1,
                    },
                    xp: {
                        type: Number,
                        default: 0,
                        min: 0,
                    },
                },
            ],
            default: [],
        },
        equippedPet: {
            type: String,
            default: null,
        },
        charms: {
            type: [
                {
                    charmId: {
                        type: String,
                        required: true,
                    },
                    level: {
                        type: Number,
                        default: 1,
                        min: 1,
                        max: 10,
                    },
                    copies: {
                        type: Number,
                        default: 0,
                        min: 0,
                    },
                },
            ],
            default: [],
        },
        activeTrap: {
            type: {
                type: String,
                enum: ['stun', 'mining_slow'],
                default: null,
            },
            slowPercent: {
                type: Number,
                min: 0,
            },
            startedAt: {
                type: Date,
            },
            expiresAt: {
                type: Date,
            },
        },
        lastMineAt: {
            type: Date,
            default: null,
        },
        lastDailyClaimAt: {
            type: Date,
            default: null,
        },
        backpacks: {
            type: [
                {
                    backpackId: {
                        type: String,
                        required: true,
                    },
                    biome: {
                        type: String,
                        required: true,
                    },
                    tier: {
                        type: Number,
                        required: true,
                        min: 1,
                    },
                },
            ],
            default: [],
        },
        equippedBackpack: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('User', UserSchema);
