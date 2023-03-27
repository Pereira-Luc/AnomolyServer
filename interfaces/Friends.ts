import {ObjectId} from "mongodb";
import {Status} from "../graphql/Enum/Status";

export interface Friends {
    friendshipId: ObjectId;
    user: ObjectId;
    friend: ObjectId;
    status: Status;
}