var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var global = {
    max_gameWidth: 5000,
    max_gameHeight: 5000,

    max_bonuses: 40,
};

var Players = [];
var Bonuses = [];

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

function GenerateRandomCoords()
{
    var x = Math.floor(Math.random() * global.max_gameWidth);
    var y = Math.floor(Math.random() * global.max_gameHeight);

    return {x: x, y: y};
}

function GenerateBonuses()
{
    for (var i = 0; i < global.max_bonuses; i++)
    {
        var position = GenerateRandomCoords();

        var bonus_datas = {
            id: i,
            type: "Bonus",
            color: GenerateRandomColor(),
            x: position.x,
            y: position.y,
        };

        Bonuses.push(bonus_datas);
    }

    console.log("[TheGAME] - `Bonus` generated !");
}

io.on("connection", function(socket) {
    console.log("[TheGAME] - USER (" + socket.id + ") connected");
    LogToPlayer(socket, "Connexion au serveur validée (ID : " + socket.id + ")");

    var p_Position = GenerateRandomCoords()
    
    Players.push({
        id: socket.id, 
        username: "#UNKNOWN",
        color: GenerateRandomColor(),
        bonus: [],
        x: p_Position.x,
        y: p_Position.y,
    });

    LogToPlayer(io, "Connexion de l'utilisateur " + socket.id + " (Joueurs : " + Players.length + ").");

    socket.on("disconnect", function() {
        console.log('[TheGAME] - USER (' + socket.id + ') disconnected');
        Players.splice(GetPlayerIndex(socket.id));

        io.emit("UpdatePlayers", {
            op_datas: Players
        })

        LogToPlayer(io, "Déconnexion de l'utilisateur " + socket.id + " (Joueurs : " + Players.length + ").");
    });

    socket.on("PlayGame", function(datas) {
        var p_index = GetPlayerIndex(socket.id);
        
        console.log('[TheGAME] - Set `username` of user (' + socket.id + ') to ' + datas.username);
        LogToPlayer(socket, "Votre nom d'utilisateur est maintenant `" + datas.username + "` (ID : " + socket.id + ")");

        UpdatePlayerData(p_index, "username", datas.username)

        socket.emit("EnterGameScreen", {
            p_datas: Players[p_index],
            op_datas: Players,
            b_datas: Bonuses,
        });

        io.emit("UpdatePlayers", {
            op_datas: Players
        })
    });

    socket.on("UpdateCoords", function(datas)
    {
        var p_index = GetPlayerIndex(socket.id);

        UpdatePlayerData(p_index, "x", datas.x);
        UpdatePlayerData(p_index, "y", datas.y);

        io.emit("UpdatePlayers", {
            op_datas: Players
        })
    });

    socket.on("BonusGathered", function(datas)
    {
        var p_index = GetPlayerIndex(socket.id);

        Players[p_index].bonus.push(datas.bonus);

        for( var i = 0; i < Bonuses.length; i++){ 
            if ( Bonuses[i].id === datas.bonus.id) {
                Bonuses.splice(i, 1); 
            }
         }

        io.emit("UpdateBonuses", {
            b_datas: Bonuses
        })
    });
})

http.listen(3000, function() {
    console.log("[TheGAME] - Server is running on port 3000.");

    console.log("[TheGAME] - Generating `Bonus`...");
    GenerateBonuses();
});