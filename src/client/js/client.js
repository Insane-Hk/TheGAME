$(function () {
    var socket = io();

    // TYPE DE TIR
    var weaponFireTypes = {
        SINGLE: 0,
        SEMIAUTO: 1,
        BURST2: 2,
        BURST3: 3,
        AUTO: 4
    };

    // TOUTES LES ARMES
    var weaponTypes = {
        PISTOL: {
            FireType: weaponFireTypes.SINGLE,
            BulletDamage: 10.0,
            BulletLifeTime: 3.0,
            BulletVelocity: 2.0,
            BulletSize: {
                w: 5.5,
                h: 15.25,
            },
            BulletImage: "9mm",
        },

        LANCE_ROCKET: {
            FireType: weaponFireTypes.SINGLE,
            BulletDamage: 10.0,
            BulletLifeTime: 3.0,
            BulletVelocity: 2.0,
            BulletSize: {
                w: 25,
                h: 60.5,
            },
            BulletImage: "rocket",

            OnDied: {
                BulletImage: "explosion",
                BulletSize: {
                    w: 25,
                    h: 35,
                },
            }
        },

        MASTER_ISSOU: {
            FireType: weaponFireTypes.SINGLE,
            BulletDamage: 10.0,
            BulletLifeTime: 4.0,
            BulletVelocity: 2.5,
            BulletSize: {
                w: 32,
                h: 32,
            },
            BulletImage: "issou",
        },

        MACRON_DECHAINER: {
            FireType: weaponFireTypes.SINGLE,
            BulletDamage: 10.0,
            BulletLifeTime: 4.0,
            BulletVelocity: 2.5,
            BulletSize: {
                w: 60,
                h: 31.4,
            },
            BulletImage: "macron",
        },

        LA_PUNITION: {
            FireType: weaponFireTypes.SINGLE,
            BulletDamage: 10.0,
            BulletLifeTime: 4.0,
            BulletVelocity: 2.5,
            BulletSize: {
                w: 25.125,
                h: 32.5,
            },
            BulletImage: "romain",
        },

        L_ASSOMEUR: {
            FireType: weaponFireTypes.SINGLE,
            BulletDamage: 10.0,
            BulletLifeTime: 4.0,
            BulletVelocity: 2.5,
            BulletSize: {
                w: 28.021,
                h: 37.71,
            },
            BulletImage: "benoit",
        },

        DEV: {
            FireType: weaponFireTypes.SINGLE,
            BulletDamage: 50.0,
            BulletLifeTime: 5.0,
            BulletVelocity: 5.0,
        },
    };

    // VARIABLES GLOBALES
    var global = {
        FPS: 0,

        m_datas: {
            UP: false,
            DOWN: false,
            LEFT: false,
            RIGHT: false,
        },

        KEY_UP: 38,
        KEY_DOWN: 40,
        KEY_LEFT: 37,
        KEY_RIGHT: 39,

        move_ratio: 2,

        gameWidth: 5000,
        gameHeight: 5000,

        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,

        xoffset: -0,
        yoffset: -0,

        lineColor: "#000",
        backgroundColor: "#222222",

        fb_datas: [],

        mouseCoord: {
            x: 0,
            y: 0,
        },
    };

    // GESTION DE TOUT LE JEU
    var GameArea = {
        canvas: $("#game-canvas"),
        graph: null,

        resizeCanvas: function (canvas, w, h) 
        {
            var c = canvas[0]
            c.width = w;
            c.height = h
        },

        resize: function () 
        {
            global.screenWidth = window.innerWidth;
            global.screenHeight = window.innerHeight;

            this.resizeCanvas(this.canvas, global.screenWidth, global.screenHeight);
        },

        getDistance: function (p1, p2) {
            return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)) - p1.radius - p2.radius;
        },

        getMouseCoord: function(evt)
        {
            var rect = document.getElementById("game-canvas").getBoundingClientRect();
            return {
                x: evt.clientX - rect.left,
                y: evt.clientY - rect.top
            };
        },

        checkCollision_bullets: function()
        {
            global.fb_datas.forEach((bullet, key) => {
                if (this.getDistance({x: global.p_datas.x, y: global.p_datas.y, radius: 20}, {x: bullet.x, y: bullet.y, radius: 10}) < 10)
                {
                    if (bullet.lifeTime >= 5.0)
                    {
                        console.log("Aie")
                        global.fb_datas.splice(key, 1);
                    }
                }
            });
        },

        processBullets: function()
        {
            global.fb_datas.forEach((bullet, key) => {
                bullet.x += bullet.dx;
                bullet.y += bullet.dy;

                if (bullet.lifeTime >= weaponTypes[global.p_datas.weapon].BulletLifeTime * 10)
                {
                    bullet.dx = 0;
                    bullet.dy = 0;

                    global.fb_datas.splice(key, 1);

                    socket.emit("UpdateBullets", {
                        bullets: global.fb_datas
                    });
                }
            });

            if (global.fb_datas.length > 0)
            {
                socket.emit("UpdateBullets", {
                    bullets: global.fb_datas
                });
            }
        },

        drawCircle: function (centerX, centerY, radius, color) 
        {
            this.graph.beginPath();
            this.graph.globalAlpha = 1;
            this.graph.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            this.graph.fillStyle = color;
            this.graph.fill();
            this.graph.strokeWidth = 5;
            this.graph.strokeStyle = "white";
            this.graph.stroke();
        },

        drawPolygon: function (ctx, x, y, radius, sides, startAngle, anticlockwise) 
        {
            if (sides < 3) return;

            var a = (Math.PI * 2)/sides;
            a = anticlockwise?-a:a;
            ctx.save();
            ctx.translate(x,y);
            ctx.rotate(startAngle);
            ctx.moveTo(radius,0);
            
            for (var i = 1; i < sides; i++) {
                ctx.lineTo(radius*Math.cos(a*i),radius*Math.sin(a*i));
            }

            ctx.closePath();
            ctx.restore();
        },

        draw_grid: function () 
        {
            this.graph.beginPath();

            this.graph.fillStyle = global.backgroundColor;
            this.graph.fillRect(0, 0, global.screenWidth, global.screenHeight);

            this.graph.lineWidth = 1;
            this.graph.strokeStyle = "#EFEFEF";
            this.graph.globalAlpha = 0.25;

            for (var x = global.xoffset - global.p_datas.x; x < global.screenWidth; x += global.screenHeight / 18) {
                this.graph.moveTo(x, 0);
                this.graph.lineTo(x, global.screenHeight);
            }

            for (var y = global.yoffset - global.p_datas.y; y < global.screenHeight; y += global.screenHeight / 18) {
                this.graph.moveTo(0, y);
                this.graph.lineTo(global.screenWidth, y);
            }

            this.graph.stroke();
        },

        draw_bonus: function()
        {
            global.b_datas.forEach(object => {
                this.graph.beginPath();
                this.graph.globalAlpha = 1;

                this.drawPolygon(this.graph, object.x - global.p_datas.x + global.screenWidth / 2, object.y - global.p_datas.y + global.screenHeight / 2, 
                    25, 8, -Math.PI/2);

                this.graph.fillStyle = "rgb(" + object.color.r + ", " + object.color.g + ", " + object.color.b + ")";
                this.graph.fill();
                this.graph.stroke();

                this.graph.font = "12px Arial";
                this.graph.textAlign = "center";
                this.graph.fillText("ID : " + object.id, 
                    object.x - global.p_datas.x + global.screenWidth / 2, 
                    object.y - global.p_datas.y + global.screenHeight / 2 + 50);
                this.graph.fillText("ITEM : " + object.bonus.ITEM, 
                    object.x - global.p_datas.x + global.screenWidth / 2, 
                    object.y - global.p_datas.y + global.screenHeight / 2 + 70);
                /**/
            });
        },

        draw_player: function() 
        {
            this.drawCircle(global.screenWidth / 2, global.screenHeight / 2, 20, 
                "rgb(" + global.p_datas.color.r + ", " + global.p_datas.color.g + ", " + global.p_datas.color.b + ")");

            this.graph.font = "16px Arial";
            this.graph.textAlign = "center";
            this.graph.fillText(global.p_datas.username, global.screenWidth / 2, global.screenHeight / 2 + 40);

            /*
            this.graph.font = "13px Arial";
            this.graph.textAlign = "center";
            this.graph.fillText("{x: " + global.p_datas.x + " - y: " + global.p_datas.y + "}", global.screenWidth / 2, global.screenHeight / 2 + 60);
            */
        },

        draw_oplayers: function()
        {
            global.op_datas.forEach(player => {
                if (player.id !== global.p_datas.id && player.username !== "#UNKNOWN")
                {
                    this.drawCircle(player.x - global.p_datas.x + global.screenWidth / 2, player.y - global.p_datas.y + global.screenHeight / 2, 20, 
                        "rgb(" + player.color.r + ", " + player.color.g + ", " + player.color.b + ")");

                    this.graph.font = "14px Arial";
                    this.graph.textAlign = "center";
                    this.graph.fillText(player.username, player.x - global.p_datas.x + global.screenWidth / 2, 
                        player.y - global.p_datas.y + global.screenHeight / 2 + 35);
                }
            });
        },

        draw_bullets: function()
        {
            global.fb_datas.forEach(bullet => {
                this.graph.beginPath();
                this.graph.globalAlpha = 1;

                if (bullet.ammo_datas.BulletImage)
                {
                    var x = bullet.x - global.p_datas.x + global.screenWidth / 2;
                    var y = bullet.y  - global.p_datas.y + global.screenHeight / 2;

                    this.graph.save();
                    this.graph.translate(x, y)
                    this.graph.rotate(bullet.angle - 80.1);

                    this.graph.drawImage(document.getElementById(bullet.ammo_datas.BulletImage), 
                       -bullet.ammo_datas.BulletSize.w / 2, -bullet.ammo_datas.BulletSize.h / 2,
                        bullet.ammo_datas.BulletSize.w, bullet.ammo_datas.BulletSize.h)

                    this.graph.restore();
                }
                else
                {
                    this.drawPolygon(this.graph, bullet.x - global.p_datas.x + global.screenWidth / 2, 
                        bullet.y  - global.p_datas.y + global.screenHeight / 2, 
                        10, 5, -Math.PI/2);
                }

                this.graph.fillStyle = "#FBD570";
                this.graph.fill();
                this.graph.stroke();

                bullet.lifeTime += 0.1
            });
        },

        draw_op_bullets: function()
        {
            global.op_datas.forEach(player => {
               // if (player.id !== global.p_datas.id && player.username !== "#UNKNOWN")
               // {
                    player.bullets.forEach(bullet => {
                        this.graph.beginPath();
                        this.graph.globalAlpha = 1;
        
                        if (bullet.ammo_datas.BulletImage)
                        {
                            var x = bullet.x - global.p_datas.x + global.screenWidth / 2;
                            var y = bullet.y  - global.p_datas.y + global.screenHeight / 2;
        
                            this.graph.save();
                            this.graph.translate(x, y)
                            this.graph.rotate(bullet.angle - 80.1);
        
                            this.graph.drawImage(document.getElementById(bullet.ammo_datas.BulletImage), 
                               -bullet.ammo_datas.BulletSize.w / 2, -bullet.ammo_datas.BulletSize.h / 2,
                                bullet.ammo_datas.BulletSize.w, bullet.ammo_datas.BulletSize.h)
        
                            this.graph.restore();
                        }
                        else
                        {
                            this.drawPolygon(this.graph, bullet.x - global.p_datas.x + global.screenWidth / 2, 
                                bullet.y  - global.p_datas.y + global.screenHeight / 2, 
                                10, 5, -Math.PI/2);
                        }
        
                        this.graph.fillStyle = "#FBD570";
                        this.graph.fill();
                        this.graph.stroke();
                    });
                //}
            });
        },

        draw_mouseCursor: function()
        {
            this.drawCircle(global.mouseCoord.x, global.mouseCoord.y, 10, 
                "rgb(" + global.p_datas.color.r + ", " + global.p_datas.color.g + ", " + global.p_datas.color.b + ")");

            this.graph.strokeWidth = 2;

            this.graph.moveTo(global.screenWidth/2, global.screenHeight/2);
            this.graph.lineTo(global.mouseCoord.x, global.mouseCoord.y);

            this.graph.strokeStyle = "rgb(" + global.p_datas.color.r + ", " + global.p_datas.color.g + ", " + global.p_datas.color.b + ")";
            this.graph.stroke();
        },

        handle_bonusGathering: function()
        {
            global.b_datas.forEach(object => {
                if (this.getDistance({x: global.p_datas.x, y: global.p_datas.y, radius: 20}, {x: object.x, y: object.y, radius: 25}) < 10)
                {
                    var bool = false;

                    global.p_datas.bonus.forEach(bonus_ => {
                        if (bonus_.id === object.id)
                        {
                            bool = true;
                        }
                    });

                    if (!bool)
                    {
                        console.log("[TheGAME] [client] - Bonus récupéré (ID: " + object.id + ")");

                        if (object.bonus.TYPE == "WEAPON")
                        {
                            global.p_datas.weapon = object.bonus.ITEM;
                        }

                        socket.emit("BonusGathered", {bonus: object})
                        global.p_datas.bonus.push(object);
                    }               
                }
            });
        },

        move: function () {
            if (global.m_datas.UP)
            {
                if (global.p_datas.y > 0.0)
                    global.p_datas.y -= global.move_ratio;
                else
                    global.p_datas.y = 0.0;
            }

            if (global.m_datas.DOWN)
            {
                if (global.p_datas.y < global.gameHeight)
                    global.p_datas.y += global.move_ratio;
                else
                    global.p_datas.y = global.gameHeight;
            }

            if (global.m_datas.LEFT)
            {
                if (global.p_datas.x > 0.0)
                    global.p_datas.x -= global.move_ratio;
                else
                    global.p_datas.x = 0.0;
            }

            if (global.m_datas.RIGHT)
            {
                if (global.p_datas.x < global.gameWidth)
                    global.p_datas.x += global.move_ratio;
                else
                    global.p_datas.x = global.gameWidth;
            }

            socket.emit("UpdateCoords", {x: global.p_datas.x, y: global.p_datas.y});
        },

        populate_playerBoard: function()
        {
            $(".players-list p").html(`
                <strong>
                    ${global.op_datas.length} JOUEURS - ${global.b_datas.length} BONUS <br> 
                    POSITION : { x: ${global.p_datas.x}, y: ${global.p_datas.y}}<br>
                    VIE: ${global.p_datas.health} - ARMURE: ${global.p_datas.armor} <br> 
                    ARME: ${global.p_datas.weapon}
                </strong>
            `);
            $(".players-list").show();
        },

        game_loop: function () {
            global.animLoopHandle = window.requestAnimFrame(GameArea.game_loop);

            if (global.m_datas.UP || global.m_datas.DOWN || global.m_datas.LEFT || global.m_datas.RIGHT)
            {
                GameArea.move();
            }

            if ((global.p_datas.x < 10 || global.p_datas.x > (global.gameWidth - 10)) || (global.p_datas.y < 10 || global.p_datas.y > (global.gameHeight - 10)))
            {
                global.backgroundColor = "#A00000";
            }
            else
            {
                global.backgroundColor = "#222222";
            }

            GameArea.draw_grid();

            GameArea.draw_bonus();

            GameArea.draw_oplayers();
            GameArea.draw_op_bullets();
            
            GameArea.draw_player();

            //GameArea.draw_bullets();

            GameArea.draw_mouseCursor();

            GameArea.handle_bonusGathering();

            //GameArea.processBullets();
            GameArea.checkCollision_bullets();

            GameArea.populate_playerBoard();
        },

        start: function () {
            this.canvas.show();
            this.graph = this.canvas[0].getContext("2d");
            this.resize();

            //this.populate_playerBoard();

            this.game_loop();
        },
    }

    // EVENEMENTS VENANT DU SERVEUR
    socket.on("EnterGameScreen", function (datas) {
        log("[TheGAME] [client] - Changement de vue Lobby => Jeu");

        global.p_datas = datas.p_datas;
        global.op_datas = datas.op_datas;
        global.b_datas = datas.b_datas;

        hideLobby();
        GameArea.start();
    });

    socket.on("UpdatePlayers", function(datas)
    {
        global.op_datas = datas.op_datas;

        //GameArea.populate_playerBoard();
    });

    socket.on("UpdateBonuses", function(datas)
    {
        global.b_datas = datas.b_datas;
    });

    // CACHER LE MENU DU JEU
    function hideLobby() {
        StopStorm();

        clearCanvas3();
        clearcanvas1();
        clearcanvas2();

        $("body").removeClass("thunder");


        $("#canvas1, #canvas2, #canvas3").hide();
        $(".game-logo").fadeOut(500);
        $(".game-menu").fadeOut(500);

        $("body").css("background-image", "none");
        $("body").css("background-color", "#222222");
    }

    // EVENEMENT SUR APPUI DU BOUTON PLAY
    $(".play-button").click(function () {
        if ($(".p_username").val().length !== 0)
        {
            socket.emit("PlayGame", {
                username: $(".p_username").val()
            });
        }
        else
        {
            log("[TheGAME] [client] - Vous devez définir un nom d'utilisateur !")
        }
    });

    // EVENEMENT SUR LE MOUVMEENT DE LA SOURIS
    $("#game-canvas").on("mousemove", function(event)
    {
        global.mouseCoord = GameArea.getMouseCoord(event);
    });

    // EVENEMENT SUR LE CLICK
    $("#game-canvas").on("click", function(event)
    {
        var x = global.mouseCoord.x;
        var y = global.mouseCoord.y;

        var angle = Math.atan2(y - global.screenHeight / 2, x - global.screenWidth / 2);

        global.op_datas.forEach(player => {
            if (player.id === global.p_datas.id)
            {
                player.bullets.push({
                    x: global.p_datas.x,
                    y: global.p_datas.y,
        
                    dx: Math.cos(angle) * weaponTypes[global.p_datas.weapon].BulletVelocity,
                    dy: Math.sin(angle) * weaponTypes[global.p_datas.weapon].BulletVelocity,
        
                    angle: angle,
        
                    lifeTime: 0.0,
        
                    ammo_datas: weaponTypes[global.p_datas.weapon],
                });

                socket.emit("UpdateBullets", {
                    bullets: player.bullets
                })
            }
        });
    });

    // EVENEMENT SUR LES TOUCHE
    $(document).keydown(function (event) {
        var key = event.keyCode;

        if (key == global.KEY_UP) {
            global.m_datas.UP = true
        }

        if (key == global.KEY_DOWN) {
            global.m_datas.DOWN = true
        }

        if (key == global.KEY_LEFT) {
            global.m_datas.LEFT = true
        }

        if (key == global.KEY_RIGHT) {
            global.m_datas.RIGHT = true
        }

        if (key == 96) {
            global.p_datas.weapon = "PISTOL"
        }

        if (key == 97) {
            global.p_datas.weapon = "LANCE_ROCKET"
        }

        if (key == 102) {
            global.p_datas.weapon = "MASTER_ISSOU"
        }
        if (key == 103) {
            global.p_datas.weapon = "MACRON_DECHAINER"
        }

        if (key == 104) {
            global.p_datas.weapon = "LA_PUNITION"
        }

        if (key == 105) {
            global.p_datas.weapon = "L_ASSOMEUR"
        }

        if (key == 110) {
            global.p_datas.weapon = "DEV"
        }
    });

    $(document).keyup(function (event) {
        var key = event.keyCode;

        if (key == global.KEY_UP) {
            global.m_datas.UP = false
        }

        if (key == global.KEY_DOWN) {
            global.m_datas.DOWN = false
        }

        if (key == global.KEY_LEFT) {
            global.m_datas.LEFT = false
        }

        if (key == global.KEY_RIGHT) {
            global.m_datas.RIGHT = false
        }
    });

    // REDIMENSIONNER LE CANVAS LORS DE LA REDIMENSION DE LA FENETRE
    window.addEventListener('resize', function () {
        GameArea.resize();
    })

    // TIMER DE BOUCLE
    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    window.cancelAnimFrame = (function (handle) {
        return window.cancelAnimationFrame ||
            window.mozCancelAnimationFrame;
    })();

    // LOGGGER
    socket.on("log", function (datas) {
        log("[" + datas.emitter + "] - " + datas.message)
    });

    Logger.close();
});