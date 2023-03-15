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
import {userExists} from "../../mongodb/functions/users";
import {checkIfFriends, getFriendshipId} from "./createFriends";
import {ChatMessage} from "../../interfaces/ChatMessage";
import {InferIdType, ObjectId} from "mongodb";
import {Friends} from "../../interfaces/Friends";
import {PubSub} from "graphql-subscriptions";

//Get Friends Chat ID from inside Chats table
export const getChatID = async (friendShipID: ObjectId): Promise<ObjectId | null> => {
    let db = await getDb();

    //Get the chat room ID from the friends table
    let res = await db.collection('Friends').findOne({_id: friendShipID});
    if (!res) { throw new Error("Chat room could not be found"); }

    if (!res.chatID) { return null; }

    return new ObjectId(res.chatID);
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

export const checkIfUserIsPartOfChat = async (username: String, chatID: ObjectId): Promise<boolean> => {
    let db = await getDb();
    let res = await db.collection('Friends').findOne({
        $or: [{
            username: username,
            chatID: chatID
        }, {friendUsername: username, chatID: chatID}]
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
        let addChatID = await db.collection('Friends').updateOne({_id: friendShipID}, {$set: {chatID: result.insertedId}});
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
    //let chatID = await getChatID(username, friendUsername);
    //Get the chat room from the chats table
    //return db.collection('Chats').findOne({_id: chatID});
    return null
}


//This function is used to send a message to a friend
export const sendMessage = async (sender: String, receiver:String ,message: String, pubSub:PubSub): Promise<ChatMessage> => {
    let db = await getDb();

    let friendShipID = await getFriendshipId(sender, receiver);

    if(!friendShipID) { throw new Error("Friendship does not exist"); }

    const date = new Date();
    //Get chat room ID from the friends table
    let chatID = await getChatID(friendShipID);

    if (!chatID) { throw new Error("Chat room does not exist"); }

    let result = await db.collection('Chats').updateOne({
        _id: chatID
    }, {$push: {messages: {message: message, messageTime: date, sender: sender, receiver: receiver}}});

    if (result.acknowledged) {
        await pubSub.publish('SEND_MSG', {
            sendMsg: {
                chatId: chatID,
                message: message,
                messageTime: date,
                sender: sender,
                receiver: receiver
            }
        });
        return {chatId: chatID, message: message, messageTime: date, sender: sender , receiver: receiver}
    }

    throw new Error("Message could not be sent");
}