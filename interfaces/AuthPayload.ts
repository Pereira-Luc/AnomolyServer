import {User} from "./User";

export interface AuthPayload {
    token: String
    tokenExpiration: number
    user: User
}