import {Auth} from "../functions/Auth";
import {signUp} from "../functions/signUp";
import {searchUser} from "../functions/searchUser";

export const UserResolvers = {
    Query: {
        login: async (resolve: any, {username, password}: any, context: any) => {
            return Auth(username, password);
        },
        searchUser: async (resolve: any, {v}: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            //Check if is empty remove spaces at the end and beginning
            if (v.trim() === "") { return []; }
            return await searchUser(v);
        },
        testLogin: async (resolve: any, parent: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) {
                console.log('Not authenticated');
                return "You are not authenticated";
            }
            console.log('Authenticated');
            return "You are authenticated";
        },
        fetchTest: async (resolve: any, parent: any, context: any) => {
            return "Fetching works";
        }
    },

    Mutation: {
        signUp: async (resolve: any, {username, password, confirmPassword, publicIdentityKey}: any, context: any) => {
            console.log('Signing up');
            return await signUp(resolve, {username, password, confirmPassword,publicIdentityKey}, context);
        }
    }
}