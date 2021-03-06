var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var global = {
    max_gameWidth: 5000,
    max_gameHeight: 5000,

    max_bonuses: 50,

    bonus_datas: [
        BONUS_LANCE_ROCKET = {
            TYPE: "WEAPON",
            ITEM: "LANCE_ROCKET",
        },
        BONUS_MASTER_ISSOU = {
            TYPE: "WEAPON",
            ITEM: "MASTER_ISSOU",
        },
        BONUS_MACRON_DECHAINER = {
            TYPE: "WEAPON",
            ITEM: "MACRON_DECHAINER",
        },
        BONUS_LA_PUNITION = {
            TYPE: "WEAPON",
            ITEM: "LA_PUNITION",
        },
        BONUS_L_ASSOMEUR = {
            TYPE: "WEAPON",
            ITEM: "L_ASSOMEUR",
        },
        BONUS_SMALL_ARMOR = {
            TYPE: "ARMOR",
            ITEM: "ARMURE NIVEAU 1",
            VALUE: 25,
        },
        BONUS_MED_ARMOR = {
            TYPE: "ARMOR",
            ITEM: "ARMURE NIVEAU 2",
            VALUE: 50,
        },
        BONUS_MAX_ARMOR = {
            TYPE: "ARMOR",
            ITEM: "ARMURE NIVEAU 3",
            VALUE: 100,
        },
        BONUS_HEALTH_REGEN_SMALL = {
            TYPE: "HEALTH",
            ITEM: "PETITE POTION REGENERATION",
            VALUE: 25,
        },
        BONUS_HEALTH_REGEN_MED = {
            TYPE: "HEALTH",
            ITEM: "MOYENNE POTION REGENERATION",
            VALUE: 50,
        },
        BONUS_HEALTH_REGEN_LARGE = {
            TYPE: "HEALTH",
            ITEM: "GRANDE POTION REGENERATION",
            VALUE: 75,
        },
        BONUS_SPEED_UP = {
            TYPE: "SPEED",
            ITEM: "BONUS VITESSE",
            VALUE: 3,
        },
        BONUS_SPEED_DOWN = {
            TYPE: "SPEED",
            ITEM: "MALUS VITESSE",
            VALUE: 1,
        },
    ],
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

        var type = Math.floor(Math.random() * global.bonus_datas.length);

        var bonus_datas = {
            id: i,
            type: "Bonus",
            color: GenerateRandomColor(),
            bonus: global.bonus_datas[type],
            x: position.x,
            y: position.y,
        };

        Bonuses.push(bonus_datas);
    }

    console.log("[TheGAME] - `Bonus` generated !");
}

function getDistance(p1, p2) {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) - p1.radius - p2.radius;
};

io.on("connection", function(socket) {
    console.log("[TheGAME] - USER (" + socket.id + ") connected");

    var p_Position = GenerateRandomCoords()
    
    Players.push({
        id: socket.id,
        //socket: socket, 
        username: "#UNKNOWN",
        color: GenerateRandomColor(),
        health: 100,
        armor: 0,
        lifes: 3,
        weapon: "PISTOL",
        bullets: [],
        bonus: [],
        x: p_Position.x,
        y: p_Position.y,
        IsDead: false,
    });

    socket.on("disconnect", function() {
        console.log('[TheGAME] - USER (' + socket.id + ') disconnected');
        //Players.splice(GetPlayerIndex(socket.id), 1);

        Players.forEach((player, key) => {
            if (player.id === socket.id)
            {
                Players.splice(key, 1);
            }
        });

        console.log(Players)

        io.emit("UpdatePlayers", {
            op_datas: Players
        });

        //LogToPlayer(io, "Déconnexion de l'utilisateur " + socket.id + " (Joueurs : " + Players.length + ").");
    });

    socket.on("PlayGame", function(datas) {
        var p_index = GetPlayerIndex(socket.id);
        
        console.log('[TheGAME] - Set `username` of user (' + socket.id + ') to ' + datas.username);
        //LogToPlayer(socket, "Votre nom d'utilisateur est maintenant `" + datas.username + "` (ID : " + socket.id + ")");

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

    socket.on("UpdateHealthAndArmor", function(datas)
    {
        var p_index = GetPlayerIndex(socket.id);

        UpdatePlayerData(p_index, "health", datas.health);
        UpdatePlayerData(p_index, "armor", datas.armor);

        io.emit("UpdatePlayers", {
            op_datas: Players
        })
    });

    socket.on("UpdateBullets", function(datas) {
        var p_index = GetPlayerIndex(socket.id);

        UpdatePlayerData(p_index, "bullets", datas.bullets);

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

    socket.on("PlayerDied", function()
    {
        var p_index = GetPlayerIndex(socket.id);

        UpdatePlayerData(p_index, "IsDead", true);

        io.emit("UpdatePlayers", {
            op_datas: Players
        });
    });

    setInterval(() => {
        if (Players.length > 0)
        {
            Players.forEach(Player => {
                
                Player.bullets.forEach((bullet, key) => {
                    bullet.x += bullet.dx;
                    bullet.y += bullet.dy;
    
                    if (bullet.lifeTime >= bullet.ammo_datas.BulletLifeTime * 10)
                    {
                        bullet.dx = 0;
                        bullet.dy = 0;
    
                        Player.bullets.splice(key, 1);
                    }

                    bullet.lifeTime += 0.1;

                    if (bullet.lifeTime > 2)
                    {
                        Players.forEach(Player_ => {
                            var p1 ={
                                x: Player_.x,
                                y: Player_.y,
                                radius: 20,
                            };

                            var p2 = {
                                x: bullet.x,
                                y: bullet.y,
                                radius: 10,
                            };

                            if (getDistance(p1, p2) < 5 && !Player_.IsDead)
                            {
                                var damage = bullet.ammo_datas.BulletDamage;
                                var armor = Player_.armor;
                                var health = Player_.health;

                                if (armor > 0)
                                {
                                    if (armor - damage > 0)
                                    {
                                        armor -= damage;
                                    }
                                    else
                                    {
                                        damage -= armor;
                                        armor = 0;

                                        if (health - damage > 0)
                                        {
                                            health -= damage;
                                        }
                                        else
                                        {
                                            health = 0;
                                        }
                                    }
                                }
                                else
                                {
                                    if (health - damage > 0)
                                    {
                                        health -= damage;
                                    }
                                    else
                                    {
                                        health = 0;
                                    }
                                }

                                Player_.health = health;
                                Player_.armor = armor;

                                io.emit("DamageReceived", {
                                    sender: Player.id,
                                    receiver: Player_.id,
                                    new_armor: armor,
                                    new_health: health,
                                });
                                
                                Player.bullets.splice(key, 1);
                            }
                        });
                    }
                });
            });

            io.emit("UpdatePlayers", {
                op_datas: Players
            })
        }
    }, 50);
})

http.listen(3000, "0.0.0.0", function() {
    console.log("[TheGAME] - Server is running on port 3000.");

    console.log("[TheGAME] - Generating `Bonus`...");
    GenerateBonuses();
});