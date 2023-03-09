//Search for a user in the database that have are LIKE the username
//Returns array of users that are LIKE the username
import {getDb} from "../../mongodb/mongoConnection";
import {Status} from "../Enum/Status";
import exp from "constants";
import {userExists} from "../../mongodb/functions/users";
import {WithId} from "mongodb";

export const searchUser = async (v: String , username: String): Promise<any> => {
    console.log('Searching for user input = ' + v);
    const db = await getDb();
    let allUsers =  await db.collection('Users').find({username: {$regex: v, $options: 'i'}}).toArray();

    for (let i = 0; i < allUsers.length; i++) {
        let otherUser = allUsers[i].username;

        //Check Status of the friend request
        allUsers[i].friendRequestStatus = await getFriendRequestStatus(username, otherUser);
    }

    return allUsers;
}


//This function is used to get the status of a friend request
export const getFriendRequestStatus = async (username: String, friendUsername: String): Promise<any> => {
    let db = await getDb();

    //Check if the user exists
    let doesUserExist = await userExists(username);
    let doesFriendExist = await userExists(friendUsername);

    if (!doesUserExist) { throw new Error("User does not exist"); }
    if (!doesFriendExist) { throw new Error("Friend does not exist"); }

    //Get Status from the database
    let statusL = await db.collection('Friends').findOne({username: username, friendUsername: friendUsername});

    let statusR = await db.collection('Friends').findOne({username: friendUsername, friendUsername: username});

    //If the user is not friends with the friend
    if (statusL === null && statusR === null) { return {status: Status.Undefined, needToAcceptBy: ''}; }

    //If the user is friends with the friend
    if (statusL !== null && statusL.status === Status.Accepted) { return {status: Status.Accepted, needToAcceptBy: ''}}
    if (statusR !== null && statusR.status === Status.Accepted) { return {status: Status.Accepted, needToAcceptBy: ''}}

    //If the user has a pending friend request
    if (statusL !== null && statusL.status === Status.Pending) { return {status: Status.Pending, needToAcceptBy: statusL.friendUsername}}
    if (statusR !== null && statusR.status === Status.Pending) { return {status: Status.Pending, needToAcceptBy: statusR.friendUsername}}

    //If the user has declined a friend request
    if (statusL !== null && statusL.status === Status.Declined) { return {status: Status.Declined, needToAcceptBy: statusL.friendUsername}}
    if (statusR !== null && statusR.status === Status.Declined) { return {status: Status.Declined, needToAcceptBy: statusR.friendUsername}}

}