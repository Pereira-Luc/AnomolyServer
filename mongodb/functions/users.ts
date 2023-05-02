import {Auth} from "../../graphql/functions/Auth";
import {User} from "../../interfaces/User";
import {ObjectId} from "mongodb";
import {getProfilePicture} from "./profilePic";

const anomolyDb = require('../mongoConnection');

// hash a password and store it in the database
export const hashPassword = async (password: String): Promise<string> => {
    console.log('Hashing password');
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password,salt);
}
//_id: ObjectId
//     username: String
//     password?: String
//     friendRequestStatus?: FriendRequestStatus
//     chatId?: ObjectId
//     publicKey: string
//     pushNotificationToken?: string
//     profilePic?: string
export const getAllUserInformation = async (userId: ObjectId) :Promise<User> => {
    userId = new ObjectId(userId);
    const user: User = await getUserById(userId, false, true);
    if (user === null) { throw new Error("User not found"); }
    //Get Profile Picture
    const profilePic = await getProfilePicture(user._id);
    if (profilePic) {user.profilePic = profilePic }

    return user;
}


//Get all information about a user
export const getUser = async (username: String) :Promise<User> => {
    const db = await anomolyDb.getDb()
    return await db.collection('Users').findOne({username: username});
}

//Get User using ID
export const getUserById = async (userId: ObjectId, wantPassword: boolean = false, wantNotificationKey: boolean = false) :Promise<User> => {
    //Check if userID is an ObjectId
    userId = new ObjectId(userId);

    const db = await anomolyDb.getDb()
    let result = await db.collection('Users').findOne({_id: userId});

    if (result && !wantPassword) { delete result.password }
    if (result && !wantNotificationKey) { delete result.pushNotificationToken }

    return result
}


//Check if User exists
export const userExists = async (username: String) :Promise<Boolean> => {
    return !!(await getUser(username));
}

//Check if User exists using ID
export const userExistsById = async (userId: ObjectId) :Promise<Boolean> => {
    return !!(await getUserById(userId));
}

//Create a new user
export const createUser = async (username: String, password: String, publicKey: Uint8Array) :Promise<any> => {
    const db = await anomolyDb.getDb()

    let hashedPassword = await hashPassword(password);

    console.log("Hashed password: " + hashedPassword);

    const result = await db.collection('Users').insertOne({
        username: username,
        password: hashedPassword,
        publicKey: publicKey,
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

//Save user's pushNotificationToken
export const savePushNotificationToken = async (userId: ObjectId, pushNotificationToken: String) :Promise<Boolean> => {
    //Check if userID is an Object
    if (typeof userId !== 'object') { userId = new ObjectId(userId); }

    console.log("Saving push notification token: " + pushNotificationToken);
    console.log("User ID: " + userId);

    const db = await anomolyDb.getDb()
    const result = await db.collection('Users').updateOne( {_id: userId}, {$set: {pushNotificationToken: pushNotificationToken}});
    //Check if worked
    return  result.modifiedCount === 1;
}

