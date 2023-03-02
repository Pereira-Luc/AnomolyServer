import { sign } from 'jsonwebtoken'
import { config } from 'dotenv';
config();

const appSecret = process.env.APP_SECRET || null;

if (appSecret === null) {
    throw new Error("APP_SECRET environment variable is not set.");
}


// Authentication function for the app password is already hashed
export const Auth = (user:String, pass:String) => {
    // Username and password
    const userId = "1";
    const username = "acc";
    const password = "1234";

    // Check if the user and password are correct
    if (user === username && pass === password) {
        // Generate jwt
        const token = sign({ userId: userId }, appSecret)
        const tokenExpiration = 1;

        //Add to the Auth
        return {userId: userId, token: token, tokenExpiration: tokenExpiration};
    }

    throw new Error("Invalid username or password");
}
