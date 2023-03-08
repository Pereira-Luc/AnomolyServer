
import {typeDefinitions} from "../graphql/schemas";
import {resolvers} from "../graphql/resolvers";
import {makeExecutableSchema} from "@graphql-tools/schema";
import {isAuth} from "../middleware/is-auth";

import { ApolloServer } from '@apollo/server';
import express from 'express';
import * as http from "http";
import {startStandaloneServer} from "@apollo/server/standalone";
import {expressMiddleware} from "@apollo/server/express4";
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import https from 'https';

const schemas = makeExecutableSchema({
    resolvers: [resolvers],
    typeDefs: [typeDefinitions],

})

const main = async () => {

    const apolloServer = new ApolloServer({
        schema: schemas,
    });

    await apolloServer.start();

    const app = express();


    app.use('/graphql', cors<cors.CorsRequest>(), bodyParser.json(), expressMiddleware(apolloServer, {
        context: async ({ req }) => {
            const isLoggedIn = await isAuth(req);
            return { ...req, isLoggedIn };
        }
    }));


    const httpServer = http.createServer(app);

    const httpsServer = https.createServer({
        key: fs.readFileSync('./certs/key.pem'),
        cert: fs.readFileSync('./certs/cert.pem'),
        passphrase: 'password',
    }, app);

    let PORT = 4000;

    httpServer.listen(PORT, () => {
        console.log(`HTTP Server running on port ${PORT}`);
    });

    httpsServer.listen(4001, () => {
        console.log(`HTTPS Server running on port 4001`);
    });

}

main()




