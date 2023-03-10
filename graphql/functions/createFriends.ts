import {getDb} from "../../mongodb/mongoConnection";
import {getUser, userExists} from "../../mongodb/functions/users";
import {ObjectId} from "mongodb";
import {Status} from "../Enum/Status";
import {getFriendRequestStatus} from "./searchUser";
import {User} from "../../interfaces/User";

//Status can be Pending, Accepted, Declined Enum

// This function is used to get the friendship ID between two users
export const getFriendshipId = async (username: String, friendUsername: String): Promise<ObjectId> => {
    const db = await getDb();
    let friends = await db.collection('Friends').findOne({$or: [{username: username, friendUsername: friendUsername}, {username: friendUsername, friendUsername: username}]});
    if (friends) { return friends._id; }

    throw new Error("Friendship ID could not be found");
}

const checkIfAlreadyRequested = async (username: String , friendUsername: String): Promise<boolean> => {
    let request =  await getFriendRequestStatus(username, friendUsername);
    return !!request.status;
}

export const checkIfFriends = async (username: String, friendUsername: String): Promise<boolean> => {
    let getFriend = await getFriendRequestStatus(username, friendUsername);
    return getFriend.status === Status.Accepted;
}

// This function is used to create a friend request between two users either throws an error or returns the friend request
export const createFriends = async (username: String, friendUsername: String): Promise<String> => {
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
    let areFriends = await checkIfAlreadyRequested(username, friendUsername);

    if (areFriends) { throw new Error("Request already sent"); }

    // Add the friend to the database
    let result = await db.collection('Friends').insertOne({ username: username, friendUsername: friendUsername, status: Status.Pending });
    if (result.acknowledged) { return 'Friend request created successfully.'}

    throw new Error("Friend request could not be created");
}


// This function is used to get all friends of a user using the userId
export const getAllFriends = async (username: String, status: String): Promise<User[]> => {
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

    let userInfoArray: User[] = []
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
            userInfoArray.push(await getUser(userInfo.friendUsername));
            continue
        }

        if (userInfo.friendUsername === username) {
            userInfoArray.push( await getUser(userInfo.username));
        }
    }

    return userInfoArray;
}

//This function is used to accept a friend request
export const acceptFriendRequest = async (username: String, friendUsername: String): Promise<String> => {
    console.log('Accepting friend request' + username + ' ' + friendUsername);
    let db = await getDb();

    let result = await db.collection('Friends').updateOne(
        {$or: [{username: friendUsername, friendUsername: username},
                {username: username, friendUsername:friendUsername}]},
        {$set: {status: Status.Accepted}});

    if (result.acknowledged) { return 'Friend request accepted successfully.'}

    throw new Error("Friend request could not be accepted");
}