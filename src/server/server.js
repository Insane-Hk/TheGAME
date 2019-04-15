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

function UpdatePlayerData(index, key, data)
{
    Players[index][key] = data;
}

function LogToPlayer(player, message)
{
    player.emit("log", {
        emitter: "TheGAME] [server",
        message: message
    })
}

function GenerateRandomColor()
{
    var r = Math.floor(Math.random() * 255)
    var g = Math.floor(Math.random() * 255)
    var b = Math.floor(Math.random() * 255)

    return {r: r, g: g, b: b}
}

io.on("connection", function(socket) {
    console.log("[TheGAME] - USER (" + socket.id + ") connected");
    LogToPlayer(socket, "Connexion au serveur validée (ID : " + socket.id + ")");
    
    Players.push({
        id: socket.id, 
        username: "#UNKNOWN",
        color: GenerateRandomColor(),
        x: 0.0,
        y: 0.0,
    });

    LogToPlayer(io, "Connexion de l'utilisateur " + socket.id + " (Joueurs : " + Players.length + ").");

    socket.on("disconnect", function() {
        console.log('[TheGAME] - USER (' + socket.id + ') disconnected');
        Players.splice(GetPlayerIndex(socket.id));

        LogToPlayer(io, "Déconnexion de l'utilisateur " + socket.id + " (Joueurs : " + Players.length + ").");
    });

    socket.on("PlayGame", function(datas) {
        var p_index = GetPlayerIndex(socket.id);
        
        console.log('[TheGAME] - Set `username` of user (' + socket.id + ') to ' + datas.username);
        LogToPlayer(socket, "Votre nom d'utilisateur est maintenant `" + datas.username + "` (ID : " + socket.id + ")");

        UpdatePlayerData(p_index, "username", datas.username)

        socket.emit("EnterGameScreen", {
            p_datas: Players[p_index]
        });
    });
})

http.listen(3000, function() {
    console.log("[TheGAME] - Server is running on port 3000.");
});