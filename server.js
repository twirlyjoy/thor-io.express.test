var express = require("express");
app = express();
var ThorIO = require("thorio").ThorIO;

var controllers = require("./controllers/controllers.js");


var thorIO = new ThorIO.Engine([{
    alias:"chat", instance: controllers.ChatController
}, {
    alias: "simplechat", instance: controllers.SimpleChatController
},{
    alias: "ball", instance: controllers.BallController
}
]);

var expressWs = require("express-ws")(app);

app.use('/test', express.static('test'));

app.ws("/", function (ws, req) {
    thorIO.addConnection(ws);
});


console.log("started", thorIO.controllers.length)

app.listen(process.env.port || 1337);