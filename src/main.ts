
import {typeDefinitions} from "../graphql/schemas";
import {resolvers} from "../graphql/resolvers";
import {makeExecutableSchema} from "@graphql-tools/schema";
import {isAuth} from "../middleware/is-auth";

import { ApolloServer } from '@apollo/server';
import express from 'express';
import * as http from "http";
import {expressMiddleware} from "@apollo/server/express4";
import cors from 'cors';
import bodyParser from 'body-parser';

import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { PubSub } from "graphql-subscriptions";
import {sendPushNotification} from "../graphql/functions/pushNotifications";

const main = async () => {


    const schema = makeExecutableSchema({
        resolvers: [resolvers],
        typeDefs: [typeDefinitions],

    })

    const app = express();
    const httpServer = http.createServer(app);

    const apolloServer = new ApolloServer({
        schema: schema,
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                }
            }
        ],
    });

    // Creating the WebSocket server Source: https://www.apollographql.com/docs/apollo-server/data/subscriptions/
    const wsServer = new WebSocketServer({
        // This is the `httpServer` we created in a previous step.
        server: httpServer,
        // Pass a different path here if app.use
        // serves expressMiddleware at a different path
        path: '/graphql',
    });
    const pubSub = new PubSub();

    // Hand in the schema we just created and have the
    // WebSocketServer start listening.
    const serverCleanup = useServer({ schema,
        context: async ( ctx, msg, args ) => {
            const userInfo = await isAuth(ctx.connectionParams);
            const isLoggedIn = userInfo !== false;
            return { ...ctx, isLoggedIn, userInfo,pubSub };
        } }, wsServer);

    await apolloServer.start();

    app.use('/graphql', cors<cors.CorsRequest>(), bodyParser.json(), expressMiddleware(apolloServer, {
        context: async ({ req }) => {
            const userInfo = await isAuth(req);
            const isLoggedIn = userInfo !== false;
            return { ...req, isLoggedIn, userInfo,pubSub };
        }
    }));

    let PORT = 4000;

    httpServer.listen(PORT, () => {
        console.log(`HTTP Server running on port ${PORT}`);
    });

}

main()




