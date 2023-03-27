import {getDb} from "../../mongodb/mongoConnection";
import {getUser, userExists} from "../../mongodb/functions/users";
import {ObjectId} from "mongodb";
import {Status} from "../Enum/Status";
import {getFriendRequestStatus} from "./searchUser";
import {User} from "../../interfaces/User";
import {createChatRoom} from "./chatsFunc";

//Status can be Pending, Accepted, Declined Enum

// This function is used to get the friendship ID between two users
export const getFriendshipId = async (username: String, friendUsername: String): Promise<ObjectId> => {
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

const checkIfAlreadyRequested = async (username: String , friendUsername: String): Promise<boolean> => {
    let request =  await getFriendRequestStatus(username, friendUsername);
    return request.status !== Status.Undefined;

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
    //         - username: String
    //         - friendUsername: String
    //         - status: String (Accepted, Pending, Declined)
    //         - chatId: ObjectID
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
            const user = await getUser(userInfo.friendUsername);
            //Add chat id to user
            user.chatId = userInfo.chatId;

            userInfoArray.push(user);
            continue
        }

        if (userInfo.friendUsername === username) {
            const user = await getUser(userInfo.username);
            //Add chat id to user
            user.chatId = userInfo.chatId;

            userInfoArray.push(user);
        }
    }

    return userInfoArray;
}

//This function is used to accept a friend request
export const acceptFriendRequest = async (username: String, friendUsername: String): Promise<String> => {
    //Check if already friends
    let areFriends = await checkIfFriends(username, friendUsername);
    if (areFriends) { throw new Error("Already friends"); }

    console.log('Accepting friend request' + username + ' ' + friendUsername);
   let friendshipId = await getFriendshipId(username, friendUsername);

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