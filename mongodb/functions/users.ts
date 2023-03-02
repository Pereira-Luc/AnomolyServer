import {Auth} from "../../graphql/functions/Auth";

const anomolyDb = require('../mongoConnection');



//Get all information about a user
export const getUser = async (username: string) :Promise<any> => {
    const db = await anomolyDb.getDb()

    let r = await db.collection('Users').findOne({ username: username });
    console.log("Getting user");
    return r;
}

//Check if User exists
export const userExists = async (username: string) :Promise<any> => {
    console.log('Checking if user exists');
    return (await getUser(username));

}


//Create a new user
export const createUser = async (username: string, password: string) :Promise<any> => {
    const db = await anomolyDb.getDb()
    let userId = await generateUserId();

    if (userId === -1) {
        throw new Error('Could not generate user ID.');
    }

    const result = await db.collection('Users').insertOne({
        userId: userId,
        username: username,
        password: password
    })

    console.log(result);

    if (result.acknowledged) {
        console.log('User created successfully.');
        return Auth(username, password);
    }

    throw new Error('Could not create user. 1');
}

const generateUserId = async () :Promise<number> => {
    console.log('Generating user ID');
    const db = await anomolyDb.getDb()

    // Use findAndModify() to increment the sequence number and get the updated value
    const result = await db.collection('counters').findOneAndUpdate(
        { _id: "userid" }, // The filter criteria for finding the counter
        { $inc: { seq: 1 } }, // The update operation to increment the sequence number
        { returnOriginal: false, upsert: true } // Options object to return the updated document, and create the document if it doesn't exist
    );

    if (result && result.value) {
        console.log('User ID generated successfully.');
        return result.value.seq;
    } else {
        console.log('Could not generate user ID.');
        return -1;
    }
}