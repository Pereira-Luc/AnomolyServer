import { sign } from 'jsonwebtoken'
import { config } from 'dotenv';
import {getUser} from "../../mongodb/functions/users";
import {AuthPayload} from "../../interfaces/AuthPayload";
import {ObjectId} from "mongodb";
config();

const appSecret = process.env.APP_SECRET || null;

if (appSecret === null) {
    throw new Error("APP_SECRET environment variable is not set.");
}


// Authentication function for the app password is already hashed
export const Auth = async (user:String, pass:String): Promise<AuthPayload> =>  {
    console.log('Authenticating');
    const bcrypt = require('bcrypt');
    //Get the user from the database
    const userInfo = await getUser(user);
    //Check if the user exists
    if (userInfo === null) { throw new Error("Invalid username or password"); }

    // Username and password
    const userId = new ObjectId(userInfo._id)
    const hashedPassword = userInfo.password;

    // Check if the user and password are correct
    if (await bcrypt.compare(pass, hashedPassword)) {
        console.log('User authenticated successfully');
        // Generate jwt
        const token = sign({ userId: userId }, appSecret)
        const tokenExpiration = 1;

        console.log("Public Key: " , userInfo.publicKey);

        //Add to the Auth
        return {token: token, tokenExpiration: tokenExpiration, user:{ _id: userId, username: user, publicKey: userInfo.publicKey}};
    }

    throw new Error("Invalid username or password");
}
