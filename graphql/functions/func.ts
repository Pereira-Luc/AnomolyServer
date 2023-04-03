//Function checks if var is object if not it returns ObjectID
import {ObjectId} from "mongodb";

export const checkIfObjectID = (varToCheck: any): any => {
    if (varToCheck instanceof ObjectId) {
        return varToCheck;
    } else {
        return new ObjectId(varToCheck);
    }
}