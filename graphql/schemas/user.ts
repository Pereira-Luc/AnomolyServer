export const UserData = /* GraphQL */ `
    type Query {
        login(username: String!, password: String!): AuthPayload!
        searchUser(v: String!): [UserInformation]!
        testLogin: String!
        fetchTest: String!
    }
    
    type User {
        userId: ID!
        username: String!
        password: String!
    }
    
    type UserInformation {
        userId: ID!
        username: String!
    }

    type AuthPayload {
        token: String!
        tokenExpiration: Int!
        user: UserInformation!
    }
    
    type Mutation {
        signUp(username: String!, password: String!, confirmPassword: String!): AuthPayload!
    }
`