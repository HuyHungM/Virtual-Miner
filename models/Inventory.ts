import mongoose, { Schema } from 'mongoose';

const InventorySchema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        items: [
            {
                itemId: {
                    type: String,
                    required: true,
                },

                quantity: {
                    type: Number,
                    required: true,
                    default: 0,
                    min: 0,
                },
            },
        ],
    },
    {
        timestamps: true,
    },
);

export default mongoose.model('Inventory', InventorySchema);
