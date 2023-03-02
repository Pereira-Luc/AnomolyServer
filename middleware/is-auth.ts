import { verify } from "jsonwebtoken";

export const isAuth = async (req: any) => {
    const appSecret = process.env.APP_SECRET || null;


    try {
        //console.log(context.req.headers.authorization);
        const authHeader = req.headers.authorization;

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
            const decodedToken = verify(token, appSecret) as { userId: string };
            if (decodedToken) { return true; }

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
