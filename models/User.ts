import mongoose, { Schema } from 'mongoose';

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
        },
        balance: {
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
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('User', UserSchema);
