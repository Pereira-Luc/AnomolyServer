import {Auth} from "../functions/Auth";
import {signUp} from "../functions/signUp";
import {searchUser} from "../functions/searchUser";
import {acceptFriendRequest, createFriends, getAllFriends} from "../functions/createFriends";
import {checkIfUserIsPartOfChat, createChatRoom, sendMessage} from "../functions/chatsFunc";
import {withFilter} from "graphql-subscriptions";
import {ObjectId} from "mongodb";
import {PubSub} from "graphql-subscriptions";



export const UserResolvers = {
    Query: {
        login: async (resolve: any, {username, password}: any, context: any) => {
            return Auth(username, password);
        },
        searchUser: async (resolve: any, {v}: any, context: any) => {
            console.log('Searching for user');
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            //Check if is empty remove spaces at the end and beginning
            if (v.trim() === "") { return []; }
            return await searchUser(v, context.userInfo.username);
        },
        loadFriends: async (resolve: any, {status}: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            return await getAllFriends(context.userInfo.username,status);
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
        },
        createFriends: async (resolve: any, {friendUsername}: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            return await createFriends(context.userInfo.username, friendUsername);
        },
        acceptRequest: async (resolve: any, {friendUsername}: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            return await acceptFriendRequest(context.userInfo.username, friendUsername);
        },
        sendMsg: async (resolve: any, {receiver, message}: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}

            return await sendMessage(context.userInfo.username, receiver, message, context.pubSub);
        }
    },

    Subscription: {
        sendMsg: {
            subscribe: async (_: any, {chatId}: any, {userInfo, pubSub}:any) => {
                console.log('Subscribing to sendMsg');
                if (!userInfo) {
                    throw new Error("You are not authenticated");
                }
                console.log('User is authenticated');
                console.log('Checking if user is part of chat');
                console.log(chatId);
                console.log(userInfo.username)

                //Check if the user is part of the chat
                if (!await checkIfUserIsPartOfChat(userInfo.username,new ObjectId(chatId))) {
                    throw new Error("You are not part of this chat");
                }

                return pubSub.asyncIterator(['SEND_MSG']);
            }
        }
    }
}