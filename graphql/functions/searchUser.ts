//Search for a user in the database that have are LIKE the username
//Returns array of users that are LIKE the username
import {getDb} from "../../mongodb/mongoConnection";

export const searchUser = async (v: string): Promise<any> => {
    console.log('Searching for user input = ' + v);
    const db = await getDb();
    return await db.collection('Users').find({username: {$regex: v, $options: 'i'}}).toArray();
}