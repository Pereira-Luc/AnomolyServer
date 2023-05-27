import {ObjectId} from "mongodb";
import {ChatMessage} from "./ChatMessage";
import {User} from "./User";

export interface ChatFeed{
    chatId: ObjectId
    chatRoomName: String
    participants: User[]
    lastMessage: ChatMessage
}