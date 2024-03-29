import {config} from 'dotenv';
config();

import { MongoClient, Db } from 'mongodb';

// URI FOR MONGODB
const uri: string = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URI}/${process.env.MONGODB_DB} `;
let client: MongoClient | null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
    if (!db) {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(process.env.MONGODB_DB);
    }

    return db;
}

export async function closeDb(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        db = null;
    }
}