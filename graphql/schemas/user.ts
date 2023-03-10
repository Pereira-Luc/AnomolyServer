export const UserData = /* GraphQL */ `
    type Query {
        login(username: String!, password: String!): AuthPayload!
        searchUser(v: String!): [User]!
        loadFriends(status:String!): [User]!
        testLogin: String!
        fetchTest: String!
    }

    type Mutation {
        signUp(username: String!, password: String!, confirmPassword: String!): AuthPayload!
        createFriends(friendUsername: String!): String!
        acceptRequest(friendUsername: String!): String!
        createChatRoom(user: String!): String!
        sendMsg(receiver: String!, message: String!): ChatMessage!
    }

    # https://www.youtube.com/watch?v=0y81xnYGWUg Shows how to use subscriptions
    type Subscription {
        loadChatFeed: [ChatFeed]!
        loadChatMessages(chatId: ID!): [ChatMessage]!
    }


    type FriendRequestStatus {
        needToAcceptBy: String
        status: String!
    }

    type User {
        userId: ID
        username: String!
        password: String
        friendRequestStatus: FriendRequestStatus
        chatId: ID
    }

    type ChatMessage {
        message: String
        messageTime: String
        sender: String
        receiver: String
    }

    type ChatRoom {
        chatId: ID
        chatMessages: [ChatMessage]
    }

    type ChatFeed {
        chatRoom: ChatRoom
        lastMessage: ChatMessage
    }

    type AuthPayload {
        token: String!
        tokenExpiration: Int!
        user: User!
    }
`