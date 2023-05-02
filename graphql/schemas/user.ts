

export const UserData = /* GraphQL */ `
    scalar Datetime
    scalar Base64
    
    type Query {
        login(username: String!, password: String!): AuthPayload!
        searchUser(v: String!): [User]!
        loadFriends(status:String!): [User]!
        loadAllChatFeed: [ChatFeed]!
        loadChatContent(chatId: ID!): [ChatMessage]!
        checkIfPushNotificationIsEnabled: Boolean!
        getUserInformation(userId: ID!): User!
        getUserProfilePic(userId: ID!): String!
        getFriendRequests: [User]!
        testLogin: String!
        fetchTest: String!
    }

    type Mutation {
        signUp(username: String!, password: String!, confirmPassword: String!, publicKey: Base64): AuthPayload!
        createFriends(friendId: ID!): String!
        acceptRequest(friendId: ID!): String!
        #createChatRoom(user: String!): String!
        sendMsg(receiverId: ID!, message: String!, chatId: ID!): ChatMessage!
        savePushNotificationToken(token: String!): String!
        changeProfilePicture(image: String!): Boolean!
        unFriend(friendId: ID!): String!
    }

    # https://www.youtube.com/watch?v=0y81xnYGWUg Shows how to use subscriptions
    type Subscription {
        chatRoomContent(chatId:ID!): ChatMessage!
        chatFeedContent: ChatFeed!
    }


    type FriendRequestStatus {
        needToAcceptBy: String
        status: String!
    }

    type User {
        _id: ID
        username: String!
        password: String
        friendRequestStatus: FriendRequestStatus
        chatId: ID
        publicKey: Base64!
        profilePic: String
        profilePicture: String
    }

    type ChatMessage {
        message: String
        messageTime: Datetime
        senderId: ID
        receiverId: ID
    }

    type ChatRoom {
        chatId: ID
        chatMessages: [ChatMessage]
    }

    type ChatFeed {
        chatId: ID!
        chatRoomName: String!
        participants: [User]!
        lastMessage: ChatMessage!
    }

    type AuthPayload {
        token: String!
        tokenExpiration: Int!
        user: User!
    }
`