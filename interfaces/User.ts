import {FriendRequestStatus} from "./FriendRequestStatus";
import {ObjectId} from "mongodb";

export interface User {
    _id: ObjectId
    username: String
    password?: String
    friendRequestStatus?: FriendRequestStatus

}