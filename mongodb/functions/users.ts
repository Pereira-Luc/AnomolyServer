import {Auth} from "../../graphql/functions/Auth";
import {User} from "../../interfaces/User";
const anomolyDb = require('../mongoConnection');

// hash a password and store it in the database
export const hashPassword = async (password: String): Promise<string> => {
    console.log('Hashing password');
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password,salt);
}


//Get all information about a user
export const getUser = async (username: String) :Promise<User> => {
    const db = await anomolyDb.getDb()
    return await db.collection('Users').findOne({username: username});
}

//Get User using ID
export const getUserById = async (userId: number) :Promise<User> => {
    const db = await anomolyDb.getDb()
    return await db.collection('Users').findOne({userId: userId});
}


//Check if User exists
export const userExists = async (username: String) :Promise<Boolean> => {
    return !!(await getUser(username));

}

//Create a new user
export const createUser = async (username: String, password: String) :Promise<any> => {
    const db = await anomolyDb.getDb()
    let userId = await generateUserId();

    if (userId === -1) {
        throw new Error('Could not generate user ID.');
    }
    let hashedPassword = await hashPassword(password);

    console.log("Hashed password: " + hashedPassword);

    //TODO: Later need to add Public Identity Key to the database

    const result = await db.collection('Users').insertOne({
        userId: userId,
        username: username,
        password: hashedPassword,
    })

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