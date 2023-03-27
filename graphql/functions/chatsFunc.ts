//Format of the Chats table
//Chats
//         - _id: ObjectID
//         - friendShipID: ObjectID
//         - messages: [ChatMessage]:
//                                    - message: String
//                                    - messageTime: String
//                                    - sender: String
//                                    - receiver: String
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
import {getUser} from "../../mongodb/functions/users";
import {sendPushNotification} from "./pushNotifications";
import {getProfilePicture} from "../../mongodb/functions/profilePic";

//Get Friends Chat ID from inside Chats table
export const getChatID = async (friendShipID: ObjectId): Promise<ObjectId | null> => {
    let db = await getDb();

    //Get the chat room ID from the friends table
    let res = await db.collection('Friends').findOne({_id: friendShipID});
    if (!res) { throw new Error("Chat room could not be found"); }

    if (!res.chatId) { return null; }

    return new ObjectId(res.chatId);
}

export const getFriendsShip = async (username: String, friendUsername: String): Promise<Friends> => {
    let db = await getDb();
    // @ts-ignore
    return await db.collection('Friends').findOne({
        $or: [{
            username: username,
            friendUsername: friendUsername
        }, {username: friendUsername, friendUsername: username}]
    });
}

export const checkIfUserIsPartOfChat = async (username: String, chatId: ObjectId): Promise<boolean> => {
    let db = await getDb();
    let res = await db.collection('Friends').findOne({
        $or: [{
            username: username,
            chatId: chatId
        }, {friendUsername: username, chatId: chatId}]
    });
    return res !== null;
}


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


//This function checks if the chat room already exists
export const chatRoomExists = async (friendShipID: ObjectId): Promise<boolean> => {
    return !!(await getChatID(friendShipID));
}

//This function is used to get the chat between two users
export const getChatOfUsers = async (username: String, friendUsername: String): Promise<any> => {
    let db = await getDb();
    //Get the chat room ID from the friends table
    //let chatId = await getChatID(username, friendUsername);
    //Get the chat room from the chats table
    //return db.collection('Chats').findOne({_id: chatId});
    return null
}


//This function is used to send a message to a friend
export const sendMessage = async (sender: string, receiver:string ,message: string, pubSub:PubSub, chatId:ObjectId): Promise<ChatMessage> => {
    let db = await getDb();

    //Check if chatId is a ObjectId
    //If chatId is not a valid Object, create a new ObjectId
    if (typeof chatId !== 'object') { chatId = new ObjectId(chatId) }

    console.log("Sender: " + sender);
    console.log("Receiver: " + receiver);

    console.log("ChatId: " + chatId);
    console.log("Message: " + message);

    //Check if user is part of the chat
    if (!await checkIfUserIsPartOfChat(sender, chatId)) { throw new Error("User is not part of the chat"); }
    const date = new Date();

    let result = await db.collection('Chats').updateOne({
        _id: chatId
    }, {$push: {messages: {message: message, messageTime: date, sender: sender, receiver: receiver}}});

    if (result.acknowledged) {
        await pubSub.publish('SEND_MSG', {
            chatRoomContent: {
                chatId: chatId,
                message: message,
                messageTime: date,
                sender: sender,
                receiver: receiver
            }
        });

        //Send notification to the receiver
        let receiverInfo = await getUser(receiver);
        if (receiverInfo) {
            const notificationToken = receiverInfo.pushNotificationToken;
            if (notificationToken) {
                sendPushNotification(notificationToken, sender , message);
            }
        }


        return {chatId: chatId, message: message, messageTime: date, sender: sender , receiver: receiver}
    }

    throw new Error("Message could not be sent");
}

//Function to load the chat feed of a user (all the chats of the user)
//{chatRoomName: String // being the name of the friend, lastMessage: ChatMessage, lastMessageTime: String}
export const loadChatFeed = async (username: String): Promise<ChatFeed []> => {
    let db = await getDb();
    let friends = await getAllFriends(username, Status.Accepted)


    let chatFeed: ChatFeed[] = [];

    for (let i = 0; i < friends.length; i++) {
        //Chat ID can be null but since we are only getting the accepted friends,
        // the chat ID should never be null
        let friendInfo = friends[i]
        let chatId = friends[i].chatId;
        if (chatId) {
            let chat = await db.collection('Chats').findOne({_id: new ObjectId(chatId)});
            if (chat) {
                //Check if the chat has any messages
                let lastMessage = { chatId: chatId, message: "No Messages", messageTime: new Date(), sender: "", receiver: ""};
                if (chat.messages.length > 0) { lastMessage = chat.messages[chat.messages.length - 1] }
                //Add profile picture of the friend
                let profilePic = await getProfilePicture(friendInfo._id);
                if (profilePic) { friendInfo.profilePic = profilePic }

                chatFeed.push({ chatId: chatId ,chatRoomName: friendInfo.username, participants: friends, lastMessage: lastMessage});
            }
        }
    }
    return chatFeed;
}

//
export const loadChatContent = async (chatId: ObjectId): Promise<ChatMessage []> => {
    const db = await getDb();

    //Get all the messages from the chat room with the given ID
    const messages = await db.collection('Chats').findOne({_id: chatId});

    if (!messages) { throw new Error("Chat room does not exist"); }

    return messages.messages.reverse();
}