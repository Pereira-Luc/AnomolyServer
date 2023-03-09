export const UserData = /* GraphQL */ `
    type Query {
        login(username: String!, password: String!): AuthPayload!
        searchUser(v: String!): [UserInformation]!
        loadFriends(status:String!): [UserInformation]!
        testLogin: String!
        fetchTest: String!
    }
    
    type User {
        userId: ID!
        username: String!
        password: String!
    }
    
    type FriendRequestStatus {
        needToAcceptBy: String
        status: String
    }
    
    type UserInformation {
        userId: ID
        username: String
        friendRequestStatus: FriendRequestStatus
    }

    type AuthPayload {
        token: String!
        tokenExpiration: Int!
        user: UserInformation!
    }
    
    type Mutation {
        signUp(username: String!, password: String!, confirmPassword: String!): AuthPayload!
        createFriends(friendUsername: String!): String!
        acceptRequest(friendUsername: String!): String!
    }
`