import { verify } from "jsonwebtoken";
import {getUserById} from "../mongodb/functions/users";
import {ObjectId} from "mongodb";

export const isAuth = async (req: any) => {
    try {
        const authHeader = req.Authorization || req.headers.authorization;

        //Check if the request has an authorization header
        if (!authHeader) {
            return false;
        }

        //Split the token from the 'Bearer' string
        const token: string = authHeader.split(' ')[1];
        if (!token || token === '') {
            return false;
        }

        //Compare the token with the secret key
        const appSecret = process.env.APP_SECRET || null;
        if (!appSecret) {
            return false;
        }

        try {
            //Try to decode the token and if it is valid user that is logged in
            const decodedToken: any = verify(token, appSecret);

            let user = await getUserById(decodedToken.userId);

            //Check if the user exists
            if (user === null) {
                return false;
            }

            //If the user is logged in return true
            return user;
        } catch (error) {
            //console.log('Invalid token');
            return false;
        }

    } catch (error) {
        //console.log(error);
        throw error;
    }

    // Call the next middleware function in the stack (resolvers)
    return false;
};
