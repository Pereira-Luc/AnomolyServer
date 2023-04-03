//Search for a user in the database that have are LIKE the username
//Returns array of users that are LIKE the username
import {getDb} from "../../mongodb/mongoConnection";
import {Status} from "../Enum/Status";
import {userExists, userExistsById} from "../../mongodb/functions/users";
import {FriendRequestStatus} from "../../interfaces/FriendRequestStatus";
import {ObjectId, WithId} from "mongodb";

export const searchUser = async (v: String , userId: ObjectId): Promise<any> => {
    console.log('Searching for user input = ' + v);
    const db = await getDb();
    let allUsers =  await db.collection('Users').find({username: {$regex: v, $options: 'i'}}).toArray();

    for (let i = 0; i < allUsers.length; i++) {
        let otherUser = allUsers[i]._id;

        //Check Status of the friend request
        allUsers[i].friendRequestStatus = await getFriendRequestStatus(userId, otherUser);
    }

    return allUsers;
}


//This function is used to get the status of a friend request
/**
 * @deprecated
 * @param username
 * @param friendUsername
 */
export const getFriendRequestStatusOld = async (username: String, friendUsername: String): Promise<FriendRequestStatus> => {
    let db = await getDb();

    //Check if the user exists
    let doesUserExist = await userExists(username);
    let doesFriendExist = await userExists(friendUsername);

    if (!doesUserExist) { throw new Error("User does not exist"); }
    if (!doesFriendExist) { throw new Error("Friend does not exist"); }

    //Get Status from the database
    let status = await db.collection('Friends').findOne({$or: [{username: username, friendUsername: friendUsername}, {username: friendUsername, friendUsername: username}]});

    //If the user is not friends with the friend
    if (!status) { return {status: Status.Undefined, needToAcceptBy: ''}; }

    //If the user is friends with the friend
    if (status.status === Status.Accepted) { return {status: Status.Accepted, needToAcceptBy: ''}}

    //If the user has a pending friend request
    if (status.status === Status.Pending) { return {status: Status.Pending, needToAcceptBy: status.friendUsername}}

    //If the user has declined a friend request
    if (status.status === Status.Declined) { return {status: Status.Declined, needToAcceptBy: status.friendUsername}}

    throw new Error("Friend request status could not be found");
}

/**
 * This function is used to get the status of a friend request
 * @param userID
 * @param friendId
 */
export const getFriendRequestStatus = async (userID: ObjectId, friendId: ObjectId): Promise<FriendRequestStatus> => {
    const db = await getDb();

    const doesUserExist = await userExistsById(userID);
    const doesFriendExist = await userExistsById(friendId);

    if (!doesUserExist) { throw new Error("User does not exist"); }
    if (!doesFriendExist) { throw new Error("Friend does not exist"); }

    const status = await db.collection('Friends').findOne({$or: [{userId: userID, friendId: friendId}, {userId: friendId, friendId: userID}]});

    if (!status) { return {status: Status.Undefined, needToAcceptBy: ''}; }

    if (status.status === Status.Accepted) { return {status: Status.Accepted, needToAcceptBy: ''}}

    if (status.status === Status.Pending) { return {status: Status.Pending, needToAcceptBy: status.frindId}}

    if (status.status === Status.Declined) { return {status: Status.Declined, needToAcceptBy: status.friendId}}

    throw new Error("Friend request status could not be found");

}