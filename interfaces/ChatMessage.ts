import {ObjectId} from "mongodb";


export interface ChatMessage{
    chatId: ObjectId
    message: String
    messageTime: Date
    senderId?: ObjectId
    receiverId?: ObjectId
}