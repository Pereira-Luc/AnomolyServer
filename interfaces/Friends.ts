import {ObjectId} from "mongodb";
import {Status} from "../graphql/Enum/Status";

export interface Friends {
    friendshipId: ObjectId;
    userId: ObjectId;
    friendId: ObjectId;
    status: Status;
}