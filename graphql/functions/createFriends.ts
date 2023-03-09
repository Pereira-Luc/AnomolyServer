import {getDb} from "../../mongodb/mongoConnection";
import {getUser, userExists} from "../../mongodb/functions/users";
import {WithId} from "mongodb";
import {Status} from "../Enum/Status";

//Status can be Pending, Accepted, Declined Enum


const checkIfFriends = async (username: String , friendUsername: String): Promise<boolean> => {
    const db = await getDb();

    let fl = await db.collection('Friends').findOne({username: username, friendId: friendUsername});
    let fr = await db.collection('Friends').findOne({username: friendUsername, friendId: username});

    return !!(fl || fr);
}

// This function is used to create a friend request between two users either throws an error or returns the friend request
export const createFriends = async (username: String, friendUsername: String): Promise<any> => {
    const db = await getDb();

    // For users to be friends I only need to add them into the table Friends
    // Table Finds looks like this:
    // { Friends:
    //         - _id: ObjectID
    //         - user_id: ObjectID
    //         - friend_id: ObjectID
    //         - status: String (Accepted, Pending, Declined)
    // }

    //Check if the user exists
    let doesUserExist = await userExists(username);
    let doesFriendExist = await userExists(friendUsername);

    if (!doesUserExist) { throw new Error("User does not exist"); }
    if (!doesFriendExist) { throw new Error("Friend does not exist"); }

    //Check if the user is already friends with the friend
    let areFriends = await checkIfFriends(username, friendUsername);

    if (areFriends) { throw new Error("Users are already friends"); }

    // Add the friend to the database
    let result = await db.collection('Friends').insertOne({ username: username, friendUsername: friendUsername, status: Status.Pending });
    if (result.acknowledged) { return 'Friend request created successfully.'}
}


// This function is used to get all friends of a user using the userId
export const getAllFriends = async (username: String, status: String): Promise<any> => {
    const db = await getDb();

    //Check if the user exists
    let doesUserExist = await userExists(username);
    if (!doesUserExist) { throw new Error("User does not exist"); }

    //Get all friends since I only store Friends in one direction (userId, friendId)
    //I need to check both userId and friendId
    let fl = await db.collection('Friends').find({username: username}).toArray();
    let fr = await db.collection('Friends').find({friendUsername: username}).toArray();

    //Return the union of the two arrays
    let union = fl.concat(fr);

    let userInfoArray = []
    //Get all the user information for each friend
    for (let i = 0; i < union.length; i++) {
        let userInfo = union[i]

        //Check if status is accepted
        if (status === Status.Accepted && userInfo.status !== Status.Accepted) { continue;}
        //Check if status is pending
        if (status === Status.Pending && userInfo.status !== Status.Pending) { continue;}
        //Check if status is declined
        if (status === Status.Declined && userInfo.status !== Status.Declined) { continue;}

        if (userInfo.username === username) {
            userInfo = await getUser(userInfo.friendUsername);
            userInfoArray.push(userInfo);
            continue
        }

        if (userInfo.friendUsername === username) {
            userInfo = await getUser(userInfo.username);
            userInfoArray.push(userInfo);
        }
    }

    return userInfoArray;
}

//This function is used to accept a friend request
export const acceptFriendRequest = async (username: String, friendUsername: String): Promise<any> => {
    console.log('Accepting friend request' + username + ' ' + friendUsername);
    let db = await getDb();
    let result = await db.collection('Friends').updateOne({username: friendUsername, friendUsername: username}, {$set: {status: Status.Accepted}});
    if (result.acknowledged) { return 'Friend request accepted successfully.'}
}