//    ProfilePic:
//         - _id: ObjectID
//         - user_id: ObjectID
//         - picture: String

import {ObjectId} from "mongodb";
const anomolyDb = require('../mongoConnection');

export const changeProfilePicture = async (userId: ObjectId, profilePicture: String) :Promise<Boolean> => {
    console.log('Changing profile picture');
    //Check if userID is an Object
    if (typeof userId !== 'object') { userId = new ObjectId(userId); }


    const db = await anomolyDb.getDb()
    //add profile picture to the database Document ProfilePic
    const result = await db.collection('ProfilePic').updateOne({user_id: userId},
        {$set: {picture: profilePicture}},
        {upsert: true})

    //Check if the profile picture was added successfully
    if (result.modifiedCount === 1) { return true } else return result.upsertedCount === 1
}


//Get profile picture
export const getProfilePicture = async (userId: ObjectId) :Promise<string | null> => {
    console.log('Getting profile picture');
    //Check if userID is an Object
    if (typeof userId !== 'object') { userId = new ObjectId(userId); }

    const db = await anomolyDb.getDb()
    //Get profile picture from the database Document ProfilePic
    const result = await db.collection('ProfilePic').findOne({user_id: userId})

    if (result) { return result.picture } else return null
}