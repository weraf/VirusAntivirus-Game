// Installera biblioteksfilerna med: npm install (behöver göras första gången)
// Starta genom att skriva "node webserver.js" i terminalen, gå sedan in på http://localhost:3000

import express, {static as staticServe} from "express"
import {createServer} from "node:http"
import { startSocketServer } from "./server/server.js";

const app = express()
const httpServer = createServer(app);
startSocketServer(httpServer)

// Setup so we can serve socket files and websocket end point
httpServer.listen(3000, () => {
    console.log("Socket server started!")
}) 

function startWebServer() {
    app.use(staticServe("./client/"))
    app.listen(3000,() => {
        console.log("Web Server Started at http://localhost:3000")
    })
}

startWebServer()