# AnomolyServer

## Description

Anomoly is a End-to-End encrypted chat application that allows users to chat with each other in a secure manner.
It uses the tweetnacl to encrypt and decrypt messages. It uses a nodejs server as a backend with graphql and apollo
server.

## Installation

First of all clone the repository using the following command:

 ```bash
git clone https://github.com/Pereira-Luc/AnomolyServer
```

Then install the dependencies using the following command:

```bash
npm install
```

## Usage

To start the app in development mode use the following command:

```bash
npm run dev
```

For nomal mode use the following command:

```bash
npm start
```


## Configuration
All the configuration is done in the .env file. The following is the default configuration:

```bash
APP_SECRET='ChangeMe'

MONGODB_URI='127.0.0.1:27017'
MONGODB_DB='anomoly'
MONGODB_USERNAME='testUser1'
MONGODB_PASSWORD='1234'

PORT=4000
```

## DOCKER COMPOSE Comming Soon




