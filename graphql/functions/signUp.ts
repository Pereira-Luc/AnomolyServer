import {createUser, userExists} from "../../mongodb/functions/users";

export const signUp = async (resolve: any, {username, password}: any, context: any) => {
    //Check if the user exists
    let doesUserExist = await userExists(username);
    if (doesUserExist !== null) { throw new Error("User already exists"); }

    //Create the user
    return await createUser(username, password);
};