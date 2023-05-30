import {createUser, userExists} from "../../mongodb/functions/users";

export const signUp = async (resolve: any, {username, password, confirmPassword, publicKey}: any, context: any) => {
    // remove spaces at the end and beginning of the username
    username = username.trim();

    //Check if the user exists
    let doesUserExist = await userExists(username);

    let errors = [];

    if (doesUserExist) { errors.push("Username already exists"); }
    if (username.length < 3) { errors.push("Username must be at least 3 characters long");}
    if (password.length < 8) { errors.push("Password must be at least 8 characters long"); }
    if (password !== confirmPassword) { errors.push("Passwords do not match"); }
    if (!publicKey) { errors.push("Problem with PublicKey"); }

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }

    //Create the user
    return await createUser(username, password, publicKey);
};

