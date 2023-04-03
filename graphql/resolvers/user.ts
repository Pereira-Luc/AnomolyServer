import {Auth} from "../functions/Auth";
import {signUp} from "../functions/signUp";
import {searchUser} from "../functions/searchUser";
import {acceptFriendRequest, createFriends, getAllFriends} from "../functions/createFriends";
import {
    checkIfUserIsPartOfChat,
    createChatRoom,
    loadChatContent,
    loadChatFeed,
    sendMessage
} from "../functions/chatsFunc";
import {ObjectId} from "mongodb";
import {
    getUser,
    getUserById,
    savePushNotificationToken
} from "../../mongodb/functions/users";
import {changeProfilePicture} from "../../mongodb/functions/profilePic";
import {User} from "../../interfaces/User";



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
            return await searchUser(v, new ObjectId(context.userInfo._id));
        },
        loadFriends: async (resolve: any, {status}: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            return await getAllFriends(new ObjectId(context.userInfo._id),status);
        },
        loadAllChatFeed: async (resolve: any, parent: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            console.log('Loading chat feed for user ' + context.userInfo.username);
            return await loadChatFeed(new ObjectId(context.userInfo._id));
        },
        loadChatContent: async (resolve: any, {chatId}: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            console.log('Loading chat content for user ' + context.userInfo.username);
            if (!await checkIfUserIsPartOfChat(context.userInfo.username, new ObjectId(chatId))) {
                throw new Error("You are not part of this chat");
            }
            return await loadChatContent(new ObjectId(chatId));
        },
        checkIfPushNotificationIsEnabled: async (resolve: any, parent: any, context: any) : Promise<boolean> => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            console.log('Checking if push notification is enabled for user ' + context.userInfo.username);

            const user:User = await getUserById(context.userInfo._id);
            if (user === null) { throw new Error("User not found"); }

            return !!(user.pushNotificationToken);
        },
        getUserProfilePicture: async (resolve: any, {userId}: any, context: any) : Promise<string> => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            console.log('Getting profile picture for user ' + context.userInfo.username);

            //Check if users are friends
            return 'Coming soon'
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
        signUp: async (resolve: any, {username, password, confirmPassword, publicKey}: any, context: any) => {
            console.log('Signing up');
            return await signUp(resolve, {username, password, confirmPassword,publicKey}, context);
        },
        createFriends: async (resolve: any, {friendId}: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            return await createFriends(new ObjectId(context.userInfo._id), new ObjectId(friendId));
        },
        acceptRequest: async (resolve: any, {friendId}: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            return await acceptFriendRequest(new ObjectId(context.userInfo._id), new ObjectId(friendId));
        },
        sendMsg: async (resolve: any, {receiverId, message, chatId}: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            return await sendMessage(new ObjectId(context.userInfo._id), new ObjectId(receiverId), message, context.pubSub, chatId);
        },
        savePushNotificationToken: async (resolve: any, {token}: any, context: any) => {
            console.log('Saving push notification token');
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            return await savePushNotificationToken(context.userInfo._id, token);
        },
        changeProfilePicture: async (resolve: any, {image}: any, context: any) => {
            //Check IF the user is authenticated
            if (!context.isLoggedIn) { throw new Error("You are not authenticated");}
            return await changeProfilePicture(context.userInfo._id, image);
        }
    },

    Subscription: {
        chatRoomContent: {
            subscribe: async (_: any, {chatId}: any, {userInfo, pubSub}:any) => {
                console.log('------------------- Subscribing to SEND_MSG_${chatId}  --------------');
                if (!userInfo) {
                    throw new Error("You are not authenticated");
                }

                //Check if the user is part of the chat
                if (!await checkIfUserIsPartOfChat(new ObjectId(userInfo._id),new ObjectId(chatId))) {
                    throw new Error("You are not part of this chat");
                }

                // Create a unique event name for the chat room
                const eventName = `SEND_MSG_${chatId}`;

                return pubSub.asyncIterator([eventName]);
            }
        },
        chatFeedContent: {
            subscribe: async (_: any, parent: any, {userInfo, pubSub}:any) => {

                if (!userInfo) {
                    throw new Error("You are not authenticated");
                }
                const userId = userInfo._id;
                console.log(`------------------- Subscribing to CHAT_FEED_CONTENT ${userId}  --------------`);

                return pubSub.asyncIterator([`CHAT_FEED_CONTENT${userId}`]);
            }
        }
    }
}