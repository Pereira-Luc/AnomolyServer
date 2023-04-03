import {getDb} from "../../mongodb/mongoConnection";
import {getUser, userExists, userExistsById} from "../../mongodb/functions/users";
import {ObjectId} from "mongodb";
import {Status} from "../Enum/Status";
import {getFriendRequestStatus} from "./searchUser";
import {User} from "../../interfaces/User";
import {createChatRoom} from "./chatsFunc";
import {FriendRequestStatus} from "../../interfaces/FriendRequestStatus";

//Status can be Pending, Accepted, Declined Enum

// This function is used to get the friendship ID between two users
/**
 * @deprecated
 * @param username
 * @param friendUsername
 */
export const getFriendshipIdOld = async (username: String, friendUsername: String): Promise<ObjectId> => {

    const db = await getDb();

    //Check if the user exists
    let doesUserExist = await userExists(username);
    let doesFriendExist = await userExists(friendUsername);

    if (!doesUserExist) { throw new Error("User does not exist"); }
    if (!doesFriendExist) { throw new Error("Friend does not exist"); }


    let friends = await db.collection('Friends').findOne({$or: [{username: username, friendUsername: friendUsername}, {username: friendUsername, friendUsername: username}]});
    if (friends) { return friends._id; }

    throw new Error("Friendship ID could not be found");
}

/**
 * This function is used to get the friendship ID between two users using the userId
 * @param userId
 * @param friendId
 */
export const getFriendshipId = async (userId: ObjectId, friendId: ObjectId): Promise<ObjectId> => {
    const db = await getDb();

    //Check if the user exists
    let doesUserExist = await userExistsById(userId);
    let doesFriendExist = await userExistsById(friendId);

    if (!doesUserExist) { throw new Error("User does not exist"); }
    if (!doesFriendExist) { throw new Error("Friend does not exist"); }

    const friends = await db.collection('Friends').findOne({$or: [{userId: userId, friendId: friendId}, {userId: friendId, friendId: userId}]});
    if (friends) { return friends._id; }

    throw new Error("Friendship ID could not be found");
}

/**
 * This function is used to check if a friend request has already been sent
 * @param userId
 * @param friendId
 */
const checkIfAlreadyRequested = async (userId: ObjectId , friendId: ObjectId): Promise<boolean> => {
    let request: FriendRequestStatus =  await getFriendRequestStatus(userId, friendId);
    return request.status !== Status.Undefined;
}

/**
 * This function is used to accept a friend request
 * @param userId
 * @param fiendId
 */
const checkIfAlreadyFriends = async (userId: ObjectId , fiendId: ObjectId): Promise<boolean> => {
    const getFriend: FriendRequestStatus = await getFriendRequestStatus(userId, fiendId);
    return getFriend.status === Status.Accepted;
}


/**
 * This function is used to create a friend request between two users either throws an error or returns the friend request
 * @param userId the user who is sending the friend request
 * @param friendId the user who is receiving the friend request
 */
export const createFriends = async (userId: ObjectId, friendId: ObjectId): Promise<String> => {
    const db = await getDb();

    // For users to be friends I only need to add them into the table Friends
    // Table Finds looks like this:
    // { Friends:
    //         - _id: ObjectID
    //         - userId: Object
    //         - friendId: String
    //         - status: String (Accepted, Pending, Declined)
    //         - chatId: ObjectID
    // }

    //Check if the user exists
    let doesUserExist = await userExistsById(userId);
    let doesFriendExist = await userExistsById(friendId);

    if (!doesUserExist) { throw new Error("User does not exist"); }
    if (!doesFriendExist) { throw new Error("Friend does not exist"); }

    //Check if the user is already friends with the friend
    let areFriends = await checkIfAlreadyFriends(userId, friendId);

    if (areFriends) { throw new Error("Request already sent"); }

    // Add the friend to the database
    let result = await db.collection('Friends').insertOne({ userId: userId, friendId: friendId, status: Status.Pending });
    if (result.acknowledged) { return 'Friend request created successfully.'}

    throw new Error("Friend request could not be created");
}


/**
 * This function is used to get all friends of a user using the userId
 * @param userId
 * @param status
 */
export const getAllFriends = async (userId: ObjectId, status: String): Promise<User[]> => {
    const db = await getDb();

    //Check if the user exists
    let doesUserExist = await userExistsById(userId);
    if (!doesUserExist) { throw new Error("User does not exist"); }

    //Get all friends since I only store Friends in one direction (userId, friendId)
    //I need to check both userId and friendId
    const friends = await db.collection('Friends').find({$or: [{userId: userId}, {friendId: userId}]}).toArray();

    let userInfoArray: User[] = []
    //Get all the user information for each friend
    for (let i = 0; i < friends.length; i++) {
        let userInfo = friends[i]

        //Check if status is accepted
        if (status === Status.Accepted && userInfo.status !== Status.Accepted) { continue;}
        //Check if status is pending
        if (status === Status.Pending && userInfo.status !== Status.Pending) { continue;}
        //Check if status is declined
        if (status === Status.Declined && userInfo.status !== Status.Declined) { continue;}

        if (userInfo._id === userId) {
            const user = await getUser(userInfo.friendUsername);
            //Add chat id to user
            user.chatId = userInfo.chatId;

            userInfoArray.push(user);
            continue
        }

        if (userInfo._id === userId) {
            const user = await getUser(userInfo.username);
            //Add chat id to user
            user.chatId = userInfo.chatId;

            userInfoArray.push(user);
        }
    }

    return userInfoArray;
}

//This function is used to accept a friend request
export const acceptFriendRequest = async (userId: ObjectId, friendId: ObjectId): Promise<String> => {

    //Check if already friends
    let areFriends = await checkIfAlreadyFriends(userId, friendId);
    if (areFriends) { throw new Error("Already friends"); }

    console.log('Accepting friend request' + userId + ' ' + friendId);
   let friendshipId = await getFriendshipId(userId, friendId);

    const db = await getDb();

    let result = await db.collection('Friends').updateOne({_id: friendshipId}, {$set: {status: Status.Accepted}});

    if (result.acknowledged) {
        //Create a chat between the two users
        const chatRoom = await createChatRoom(friendshipId);
        console.log(chatRoom);
        if (!chatRoom) {
            //If the chat room could not be created then go back to pending
            await db.collection('Friends').updateOne({_id: friendshipId}, {$set: {status: Status.Pending}});
        }

        return 'Friend request accepted successfully.'
    }

    throw new Error("Friend request could not be accepted");
}

