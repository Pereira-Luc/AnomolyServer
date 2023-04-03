//Format of the Chats table
//Chats
//         - _id: ObjectID
//         - friendShipID: ObjectID
//         - messages: [ChatMessage]:
//                                    - message: String
//                                    - messageTime: String
//                                    - senderId: ObjectId
//                                    - receiverId: ObjectId
//         - createdAt: Date
//


import {getDb} from "../../mongodb/mongoConnection";
import {getAllFriends} from "./createFriends";
import {ChatMessage} from "../../interfaces/ChatMessage";
import {ObjectId} from "mongodb";
import {Friends} from "../../interfaces/Friends";
import {PubSub} from "graphql-subscriptions";
import {ChatFeed} from "../../interfaces/ChatFeed";
import {Status} from "../Enum/Status";
import {getUser, getUserById} from "../../mongodb/functions/users";
import {sendPushNotification} from "./pushNotifications";
import {getProfilePicture} from "../../mongodb/functions/profilePic";
import {User} from "../../interfaces/User";

/**
 * This function is used to get the chat room ID from the Friends table
 * @param friendShipID
 */
export const getChatID = async (friendShipID: ObjectId): Promise<ObjectId | null> => {
    let db = await getDb();

    //Get the chat room ID from the friends table
    let res = await db.collection('Friends').findOne({_id: friendShipID});
    if (!res) { throw new Error("Chat room could not be found"); }

    if (!res.chatId) { return null; }

    return new ObjectId(res.chatId);
}

/**
 * This function is used to get a friendShip object from the Friends table
 * @param userId
 * @param friendId
 */
export const getFriendsShip = async (userId: ObjectId, friendId: ObjectId): Promise<Friends> => {
    let db = await getDb();
    // @ts-ignore
    return await db.collection('Friends').findOne({
        $or: [{ userId: userId, friendId: friendId }, {userId: friendId, friendId: userId}]
    });
}

/**
 * This function is used to check if a user is part of a chat room
 * @param userId
 * @param chatId
 */
export const checkIfUserIsPartOfChat = async (userId: ObjectId, chatId: ObjectId): Promise<boolean> => {
    let db = await getDb();
    let res = await db.collection('Friends').findOne({
        $or: [{ userId: userId,  chatId: chatId }, { friendId: userId, chatId: chatId }]
    });
    return res !== null;
}


/**
 * This function is used to check if a chat room exists
 * @param friendShipID
 */
export const createChatRoom = async (friendShipID: ObjectId): Promise<String> => {
    let db = await getDb();

    //Check if the chat room already exists
    if (await chatRoomExists(friendShipID)) { throw new Error("Chat room already exists"); }
    let result = await db.collection('Chats').insertOne({messages: []});

    if (result.acknowledged) {
        //Add the chat room ID to the friends table
        let addChatID = await db.collection('Friends').updateOne({_id: friendShipID}, {$set: {chatId: result.insertedId}});
        if (addChatID.acknowledged) { return 'Chat room created successfully.' }

        //Undo the chat room creation if the chat room ID could not be added to the friends table
        await db.collection('Chats').deleteOne({_id: result.insertedId});
        throw new Error('Chat room could not be created');
    }

    throw new Error("Chat room could not be created");
}


/**
 * This function is used to check if a chat room exists
 * @param friendShipID
 */
export const chatRoomExists = async (friendShipID: ObjectId): Promise<boolean> => {
    return !!(await getChatID(friendShipID));
}

//This function is used to get the chat between two users
export const getChatOfUsers = async (userId: ObjectId, friendId: ObjectId): Promise<any> => {
    let db = await getDb();
    //Get the chat room ID from the friends table
    //let chatId = await getChatID(username, friendUsername);
    //Get the chat room from the chats table
    //return db.collection('Chats').findOne({_id: chatId});
    return null
}


/**
 * This function is used to send a message to a friend
 * @param senderId
 * @param receiverId
 * @param message
 * @param pubSub
 * @param chatId
 */
export const sendMessage = async (senderId: ObjectId, receiverId:ObjectId ,message: string, pubSub:PubSub, chatId:ObjectId): Promise<ChatMessage> => {
    let db = await getDb();

    //Check if chatId is a ObjectId
    //If chatId is not a valid Object, create a new ObjectId
    if (typeof chatId !== 'object') { chatId = new ObjectId(chatId) }

    console.log("Sender: " + senderId);
    console.log("Receiver: " + receiverId);

    console.log("ChatId: " + chatId);
    console.log("Message: " + message);

    //Check if user is part of the chat
    if (!await checkIfUserIsPartOfChat(senderId, chatId)) { throw new Error("User is not part of the chat"); }
    const date = new Date();

    let result = await db.collection('Chats').updateOne({
        _id: chatId
    }, {$push: {messages: {message: message, messageTime: date, senderId: senderId, receiverId: receiverId}}});

    if (result.acknowledged) {
        await pubSub.publish('SEND_MSG', {
            chatRoomContent: {
                chatId: chatId,
                message: message,
                messageTime: date,
                senderId: senderId,
                receiverId: receiverId
            }
        });

        //Send notification to the receiver
        let receiverInfo:User = await getUserById(receiverId);
        const sender:User = await getUserById(senderId);
        if (receiverInfo) {
            const notificationToken = receiverInfo.pushNotificationToken;
            if (notificationToken) {
                await sendPushNotification(notificationToken, sender.username, message);
            }
        }


        return {chatId: chatId, message: message, messageTime: date, senderId: senderId , receiverId: receiverId}
    }

    throw new Error("Message could not be sent");
}

/**
 * This function is used to load the chat feed of a user (all the chats of the user)
 * @param userId
 */
export const loadChatFeed = async (userId: ObjectId): Promise<ChatFeed []> => {
    let db = await getDb();
    let friends: User[] = await getAllFriends(userId, Status.Accepted)

    let chatFeed: ChatFeed[] = [];

    for (let i = 0; i < friends.length; i++) {
        //Chat ID can be null but since we are only getting the accepted friends,
        // the chat ID should never be null
        let friendInfo = friends[i]

        let chatId: ObjectId = new ObjectId(friendInfo.chatId)
        if (chatId) {
            let chat = await db.collection('Chats').findOne({_id: new ObjectId(chatId)});
            if (chat) {
                //Check if the chat has any messages
                let lastMessage = { chatId: chatId, message: "No Messages", messageTime: new Date(), senderId: new ObjectId(''), receiverId: new ObjectId('')};
                if (chat.messages.length > 0) { lastMessage = chat.messages[chat.messages.length - 1] }
                //Add profile picture of the friend
                let profilePic: string | null = await getProfilePicture(friendInfo._id);
                if (profilePic) { friendInfo.profilePic = profilePic }
                chatFeed.push({ chatId: chatId ,chatRoomName: friendInfo.username, participants: [friendInfo], lastMessage: lastMessage});
            }
        }
    }

    //order the chat feed by the last message time
    chatFeed.sort((a:ChatFeed, b:ChatFeed) => {
        return b.lastMessage.messageTime.getTime() - a.lastMessage.messageTime.getTime();
    });

    return chatFeed;
}

/**
 * This function is used to load the chat content of a chat room
 * @param chatId
 */
export const loadChatContent = async (chatId: ObjectId): Promise<ChatMessage []> => {
    const db = await getDb();

    //Get all the messages from the chat room with the given ID
    const messages = await db.collection('Chats').findOne({_id: chatId});

    if (!messages) { throw new Error("Chat room does not exist"); }

    return messages.messages.reverse();
}