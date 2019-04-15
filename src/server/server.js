var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var Players = [];

app.use(express.static(__dirname + '/../client'));

app.get("/", function(req, res) {
    res.sendFile(__dirname + '/../client/index.html');
});

function GetPlayerIndex(socketId)
{
    var index = null;
    Players.forEach((Player, key) => {
        if (Player.id === socketId)
        {
            index = key;
        }
    });

    return index;
}

io.on("connection", function(socket) {
    console.log("[TheGAME] - USER (" + socket.id + ") connected");

    Players.push({
        id: socket.id, 
        username: "#UNKNOWN"
    });

    socket.on("disconnect", function() {
        console.log('[TheGAME] - USER (' + socket.id + ') disconnected');
        Players.splice(GetPlayerIndex(socket.id));
    });

    socket.on("PlayGame", function(datas) {
        console.log('[TheGAME] - Set `username` of user (' + socket.id + ') to ' + datas.username);

        var p_index = GetPlayerIndex(socket.id);
        Players[p_index].username = datas.username;
    });
})

http.listen(3000, function() {
    console.log("[TheGAME] - Server is running on port 3000.");
});