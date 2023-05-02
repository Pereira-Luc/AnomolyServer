import {getDb} from "../../mongodb/mongoConnection";
import {getUserById, userExistsById} from "../../mongodb/functions/users";
import {ObjectId} from "mongodb";
import {Status} from "../Enum/Status";
import {getFriendRequestStatus} from "./searchUser";
import {User} from "../../interfaces/User";
import {createChatRoom, getChatID} from "./chatsFunc";
import {FriendRequestStatus} from "../../interfaces/FriendRequestStatus";
import {sendPushNotification} from "./pushNotifications";
import {PubSub} from "graphql-subscriptions";

//Status can be Pending, Accepted, Declined Enum

/**
 * This function is used to get the friendship ID between two users using the userId
 * @param userId
 * @param friendId
 * @returns {Promise<ObjectId>} the friendship ID
 */
export const getFriendshipId = async (userId: ObjectId, friendId: ObjectId): Promise<ObjectId> => {
    const db = await getDb();

    //Check if the user exists
    let doesUserExist = await userExistsById(userId);
    let doesFriendExist = await userExistsById(friendId);

    if (!doesUserExist) { throw new Error("User does not exist"); }
    if (!doesFriendExist) { throw new Error("Friend does not exist"); }

    const friends = await db.collection('Friends').findOne({$or: [{userId: userId, friendId: friendId}, {userId: friendId, friendId: userId}]});
    if (friends) { return new ObjectId(friends._id) }

    throw new Error("Friendship ID could not be found");
}

/**
 * This function is used to check if a friend request has already been sent
 * @param userId
 * @param friendId
 * @returns {Promise<boolean>} true if already requested
 */
const checkIfAlreadyRequested = async (userId: ObjectId , friendId: ObjectId): Promise<boolean> => {
    let request: FriendRequestStatus =  await getFriendRequestStatus(userId, friendId);
    return request.status !== Status.Undefined;
}

/**
 * This function is used to accept a friend request
 * @param userId
 * @param fiendId
 * @returns {Promise<boolean>} true if already friends
 */
const checkIfAlreadyFriends = async (userId: ObjectId , fiendId: ObjectId): Promise<boolean> => {
    const getFriend: FriendRequestStatus = await getFriendRequestStatus(userId, fiendId);
    return getFriend.status === Status.Accepted;
}


/**
 * This function is used to create a friend request between two users either throws an error or returns the friend request
 * @param userId the user who is sending the friend request
 * @param friendId the user who is receiving the friend request
 *
 * @returns Promise<String> Success message
 */
export const createFriends = async (userId: ObjectId, friendId: ObjectId): Promise<String> => {
    const db = await getDb();

    userId = new ObjectId(userId);
    friendId = new ObjectId(friendId);

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
 * @returns {Promise<User[]>}
 */
export const getAllFriends = async (userId: ObjectId, status: String): Promise<User[]> => {
    const db = await getDb();

    userId = new ObjectId(userId);

    //Check if the user exists
    let doesUserExist = await userExistsById(userId);
    if (!doesUserExist) { throw new Error("User does not exist"); }

    //Get all friends since I only store Friends in one direction (userId, friendId)
    //I need to check both userId and friendId
    const friends = await db.collection('Friends').find({$or: [{userId: userId}, {friendId: userId}]}).toArray();

    console.log(friends);

    let userInfoArray: User[] = []
    //Get all the user information for each friend
    for (let i = 0; i < friends.length; i++) {
        let friendShip = friends[i]


        //Check if status is accepted
        if (status === Status.Accepted && friendShip.status !== Status.Accepted) { continue }
        //Check if status is pending
        if (status === Status.Pending && friendShip.status !== Status.Pending) { continue }
        //Check if status is declined
        if (status === Status.Declined && friendShip.status !== Status.Declined) { continue }


        //Get the user information except for if the user is the current user
        const user: User = friendShip.userId.toString() === userId.toString() ?
            await getUserById(friendShip.friendId) : await getUserById(friendShip.userId);

        //add the chatId to the user if it exists
        if (friendShip.chatId) { user.chatId = friendShip.chatId }
        //add friend request status
        user.friendRequestStatus = await getFriendRequestStatus(userId, user._id)

        userInfoArray.push(user);
    }
    return userInfoArray;
}

/**
 * This function is used to accept a friend request
 * @param userId
 * @param friendId
 * @param pubSub
 * @returns {Promise<String>}
 */
export const acceptFriendRequest = async (userId: ObjectId, friendId: ObjectId, pubSub: PubSub): Promise<String> => {

    //Check if already friends
    let areFriends = await checkIfAlreadyFriends(userId, friendId);
    if (areFriends) { throw new Error("Already friends"); }

    console.log('Accepting friend request' + userId + ' ' + friendId);
   let friendshipId = await getFriendshipId(userId, friendId);

    const db = await getDb();
    let acceptedDate = new Date();
    //Add date accepted
    let result = await db.collection('Friends').updateOne({_id: friendshipId}, {$set: {status: Status.Accepted, acceptedDate: acceptedDate}});

    if  (result.modifiedCount === 1) {
        //Create a chat between the two users
        const chatRoom = await createChatRoom(friendshipId);
        console.log(chatRoom);
        if (!chatRoom) {
            //If the chat room could not be created then go back to pending
            await db.collection('Friends').updateOne({_id: friendshipId}, {$set: {status: Status.Pending}});
        }
        let userInformation: User = await getUserById(userId);
        let friendInformation: User = await getUserById(friendId, false, true);
        let friendPushToken:String | undefined = friendInformation.pushNotificationToken;

        if (friendPushToken){ friendInformation.pushNotificationToken = undefined; }

        console.log('Publishing to ' + `CHAT_FEED_CONTENT${userId}`);
        await pubSub.publish(`CHAT_FEED_CONTENT${friendId}`, {
            chatFeedContent: {
                chatId: chatRoom,
                lastMessage: {message: "No Message", messageTime: new Date(), senderId: friendId, receiverId: userId},
                chatRoomName: userInformation.username,
                participants: [friendInformation, userInformation],
                lastMessageTime: acceptedDate,
            }
        })

        await pubSub.publish(`CHAT_FEED_CONTENT${userId}`, {
            chatFeedContent: {
                chatId: chatRoom,
                lastMessage: {message: "No Message", messageTime: new Date(), senderId: friendId, receiverId: userId},
                chatRoomName: friendInformation.username,
                participants: [userInformation, friendInformation],
                lastMessageTime: acceptedDate,
            }
        })


        //send a notification to the user
        if (typeof friendPushToken !== 'undefined'){
            await sendPushNotification(friendPushToken, 'Anomoly', `${userInformation.username} has accepted your friend request.`, {type: 'friendRequestAccepted', userId: userId.toString()});
        }


        return 'Friend request accepted successfully.'
    }

    throw new Error("Friend request could not be accepted");
}

/**
 * This function is used to Unfriend a user
 * @param userId the user who is unfriending
 * @param friendId the user who is being unfriended
 * @returns {Promise<String>} Success message
 */

export const unfriend = async (userId: ObjectId, friendId: ObjectId): Promise<String> => {
   const db = await getDb();

    userId = new ObjectId(userId);
    friendId = new ObjectId(friendId);

    //Check if the user exists
    const doesUserExist = await userExistsById(userId);
    const doesFriendExist = await userExistsById(friendId);

    if (!doesUserExist) { throw new Error("User does not exist"); }
    if (!doesFriendExist) { throw new Error("Friend does not exist"); }

    //Check if the user is already friends with the friend
    const areFriends = await checkIfAlreadyFriends(userId, friendId);

    if (!areFriends) { throw new Error("Not friends"); }

    // Get the friendshipId
    const friendshipId: ObjectId = await getFriendshipId(userId, friendId);

    // get the chatId
    const chatId: ObjectId | null = await getChatID(friendshipId);

    if (chatId) {
        //Remove the chat
        await db.collection('Chats').deleteOne({_id: chatId});
    }

    //Remove the friendship
    const result = await db.collection('Friends').deleteOne({_id: friendshipId});

    if (result.deletedCount === 1) { return 'Friend removed successfully.'}

    throw new Error("Friend could not be removed");
}

