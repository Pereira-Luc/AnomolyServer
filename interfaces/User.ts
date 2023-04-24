import {FriendRequestStatus} from "./FriendRequestStatus";
import {ObjectId} from "mongodb";


/**
 * This interface is used to define the User object
 */
export interface User {
    _id: ObjectId
    username: String
    password?: String
    friendRequestStatus?: FriendRequestStatus
    chatId?: ObjectId
    publicKey: string
    pushNotificationToken?: string
    profilePic?: string
}