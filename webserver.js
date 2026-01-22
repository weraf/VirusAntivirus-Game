// Installera biblioteksfilen med: npm install (behöver göras första gången)
// Starta genom att skriva "node webserver.js" i terminalen, gå sedan in på http://localhost:3000

import express, {static as staticServe} from "express"

const webServer = express()

function startWebServer() {
    webServer.use(staticServe("client"))
    webServer.use(staticServe("shared"))
    webServer.listen(3000,() => {
        console.log("Web Server Started!")
    })
}

startWebServer()