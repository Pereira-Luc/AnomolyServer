import { sign } from 'jsonwebtoken'
import { config } from 'dotenv';
import {getUser} from "../../mongodb/functions/users";
config();

const appSecret = process.env.APP_SECRET || null;

if (appSecret === null) {
    throw new Error("APP_SECRET environment variable is not set.");
}


// Authentication function for the app password is already hashed
export const Auth = async (user:String, pass:String) => {
    const bcrypt = require('bcrypt');
    //Get the user from the database
    const userInfo = await getUser(user);

    //Check if the user exists
    if (userInfo === null) { throw new Error("Invalid username or password"); }

    // Username and password
    const userId = userInfo.userId;
    const hashedPassword = userInfo.password;

    // Check if the user and password are correct
    if (await bcrypt.compare(pass, hashedPassword)) {
        // Generate jwt
        const token = sign({ userId: userId }, appSecret)
        const tokenExpiration = 1;

        //Add to the Auth
        return {userId: userId, token: token, tokenExpiration: tokenExpiration};
    }

    throw new Error("Invalid username or password");
}
