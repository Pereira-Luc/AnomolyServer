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
import {checkIfFriends} from "./createFriends";
import {ChatMessage} from "../../interfaces/ChatMessage";


export const createChatRoom = async (username:String, friendUsername: String) => {
    let db = await getDb();

    //Check if the user exists
    let doesUserExist = await userExists(username);
    let doesFriendExist = await userExists(friendUsername);
    if (!doesUserExist || !doesFriendExist) { throw new Error("One or Both user's dont Exist") }


    //Check if they are friends
    let areFriends = await checkIfFriends(username, friendUsername);
    if (!areFriends) { throw new Error("Users are not friends"); }

    //Check if the chat room already exists
    if (await chatRoomExists(username, friendUsername)) { throw new Error("Chat room already exists"); }
    let result = await db.collection('Chats').insertOne({username: username, friendUsername: friendUsername, messages: []});
    if (result.acknowledged) { return 'Chat room created successfully.'}

    throw new Error("Chat room could not be created");
}


//This function checks if the chat room already exists
export const chatRoomExists = async (username: String, friendUsername: String): Promise<boolean> => {
    let r = await getChatOfUsers(username, friendUsername)
    return r && r.length > 0;
}

//This function is used to get the chat between two users
export const getChatOfUsers = async (username: String, friendUsername: String): Promise<any> => {
    let db = await getDb();

    return await db.collection('Chats').find({
        $or: [{username: username, friendUsername: friendUsername},
            {username: friendUsername, friendUsername: username}]
    }).toArray();
}


//This function is used to send a message to a friend
export const sendMessage = async (username: String, friendUsername: String, message: String): Promise<ChatMessage> => {
    let db = await getDb();

    //Check if the user exists
    let doesUserExist = await userExists(username);
    let doesFriendExist = await userExists(friendUsername);
    if (!doesUserExist || !doesFriendExist) { throw new Error("One or Both user's dont Exist") }

    //Check if they are friends
    let areFriends = await checkIfFriends(username, friendUsername);
    if (!areFriends) { throw new Error("Users are not friends"); }

    //Check if the chat room already exists
    if (!await chatRoomExists(username, friendUsername)) { throw new Error("Chat room does not exist"); }

    const date = new Date();

    let result = await db.collection('Chats').updateOne({
        $or: [{username: username, friendUsername: friendUsername},
            {username: friendUsername, friendUsername: username}]
    }, {$push: {messages: {message: message, messageTime: date, sender: username, receiver: friendUsername}}});

    if (result.acknowledged) { return {message: message, messageTime: date, sender: username , receiver: friendUsername} }

    throw new Error("Message could not be sent");
}