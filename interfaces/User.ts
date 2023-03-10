import {FriendRequestStatus} from "./FriendRequestStatus";

export interface User {
    userId: number
    username: String
    password?: String
    friendRequestStatus?: FriendRequestStatus

}