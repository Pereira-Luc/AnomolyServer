
import {typeDefinitions} from "../graphql/schemas";
import {resolvers} from "../graphql/resolvers";
import {makeExecutableSchema} from "@graphql-tools/schema";
import {isAuth} from "../middleware/is-auth";

import { ApolloServer } from '@apollo/server';
import express from 'express';
import * as http from "http";
import {startStandaloneServer} from "@apollo/server/standalone";

const schemas = makeExecutableSchema({
    resolvers: [resolvers],
    typeDefs: [typeDefinitions],

})

const main = async () => {
    const app = express();
    const httpServer = http.createServer(app);

    const apolloServer = new ApolloServer({
        schema: schemas,
    });

    const { url } = await startStandaloneServer(apolloServer, {
        context: async ({ req }) => {
            const isLoggedIn = await isAuth(req);
            return { ...req, isLoggedIn };
        },
    });

    return url;
}

main().then( async (url) => {
    console.log(`🚀 Server listening at: ${url}`);
})




