import mongoose from 'mongoose';

const uri = process.env.MONGO_URI;

if (!uri) {
    throw new Error('Missing MONGO_URI');
}

export default async () => {
    try {
        await mongoose.connect(uri);
        console.log('[MONGOOSE] Đã tải Database');
    } catch (error) {
        console.error(error);
        throw error;
    }
};
