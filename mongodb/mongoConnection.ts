import {config} from 'dotenv';
config();

import { MongoClient, Db } from 'mongodb';

// URI FOR MONGODB
const uri: string = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URI}/${process.env.MONGODB_DB} `;

export async function getDb(): Promise<Db> {
    // If no connection exists, create a new client object and connect to the database
    let client = await MongoClient.connect(uri);
    return client.db();
}