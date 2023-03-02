export const UserData = /* GraphQL */ `
    type Query {
        login(username: String!, password: String!): AuthPayload!
        testLogin: String!
        signUp(username: String!, password: String!): AuthPayload!
    }
    
    type User {
        userId: ID!
        username: String!
        password: String!
    }

    type AuthPayload {
        userId: ID!
        token: String!
        tokenExpiration: Int!
    }
`