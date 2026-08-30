import mongoose, { Schema } from 'mongoose';

const HistorySchema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        items: [
            {
                itemId: {
                    type: String,
                    required: true,
                },
                quantity: {
                    type: String,
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

export default mongoose.model('History', HistorySchema);
