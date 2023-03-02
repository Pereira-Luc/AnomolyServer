import {Auth} from "../functions/Auth";
import {signUp} from "../functions/signUp";

export const UserResolvers = {
    Query: {
        login: async (resolve: any, {username, password}: any, context: any) => {
            return Auth(username, password);
        },
        testLogin: async (resolve: any, parent: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) {
                console.log('Not authenticated');
                return "You are not authenticated";
            }
            console.log('Authenticated');
            return "You are authenticated";
        },signUp: async (resolve: any, {username, password}: any, context: any) => {
            console.log('Signing up');
            return await signUp(resolve, {username, password}, context);
        }
    }
}