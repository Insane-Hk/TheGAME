$(function () {
    var socket = io();

    var global = {
        FPS: 0,

        KEY_UP: 38,
        KEY_DOWN: 40,
        KEY_LEFT: 37,
        KEY_RIGHT: 39,

        move_ratio: 5,

        gameWidth: 5000,
        gameHeight: 5000,

        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,

        xoffset: -0,
        yoffset: -0,

        lineColor: "#000",
        backgroundColor: "#222222",

        mouseCoord: {
            x: 0,
            y: 0,
        },
    };

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

            
            this.graph.font = "13px Arial";
            this.graph.textAlign = "center";
            this.graph.fillText("{x: " + global.p_datas.x + " - y: " + global.p_datas.y + "}", global.screenWidth / 2, global.screenHeight / 2 + 60);
            /**/
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
                        socket.emit("BonusGathered", {bonus: object})
                        global.p_datas.bonus.push(object);
                    }               
                }
            });
        },

        game_loop: function () {
            global.animLoopHandle = window.requestAnimFrame(GameArea.game_loop);

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
            GameArea.draw_player();

            GameArea.draw_mouseCursor();

            GameArea.handle_bonusGathering();
        },

        move: function (direction) {
            switch (direction)
            {
                case "UP":
                    if (global.p_datas.y > 0.0)
                        global.p_datas.y -= global.move_ratio;
                    else
                        global.p_datas.y = 0.0;

                    break;

                case "DOWN":
                    if (global.p_datas.y < global.gameHeight)
                        global.p_datas.y += global.move_ratio;
                    else
                        global.p_datas.y = global.gameHeight;

                    break;

                case "LEFT":
                    if (global.p_datas.x > 0.0)
                        global.p_datas.x -= global.move_ratio;
                    else
                        global.p_datas.x = 0.0;

                    break;

                case "RIGHT":
                    if (global.p_datas.x < global.gameWidth)
                        global.p_datas.x += global.move_ratio;
                    else
                        global.p_datas.x = global.gameWidth;

                    break;

                default : 
                    break;
            }

            socket.emit("UpdateCoords", {x: global.p_datas.x, y: global.p_datas.y});

            //log("[TheGAME] [client] - Coordonnées {x: " + global.p_datas.x + ", y: " + global.p_datas.y + "}");
        },

        populate_playerBoard: function()
        {
            /*

            $(".players-list .players").html("");

            global.op_datas.forEach(player => {
                $(".players-list .players").append(`
                    <div class="row mb-2 mx-1">
                        <span class="mr-auto">${player.username}</span>
                        <span class="ml-auto"></span>
                    </div>
                `);
            });

            */

            $(".players-list h6").text(`${global.op_datas.length} JOUEURS - ${global.b_datas.length} BONUS`);
            $(".players-list").show();
        },

        start: function () {
            this.canvas.show();
            this.graph = this.canvas[0].getContext("2d");
            this.resize();

            this.populate_playerBoard();

            this.game_loop();
        },
    }

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

        GameArea.populate_playerBoard();
    });

    socket.on("UpdateBonuses", function(datas)
    {
        global.b_datas = datas.b_datas;
    });

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

    $("#game-canvas").on("mousemove", function(event)
    {
        global.mouseCoord = GameArea.getMouseCoord(event);
    });

    $(document).keydown(function (event) {
        var key = event.keyCode;

        if (key == global.KEY_UP) {
            GameArea.move("UP");
        }

        if (key == global.KEY_DOWN) {
            GameArea.move("DOWN");
        }

        if (key == global.KEY_LEFT) {
            GameArea.move("LEFT");
        }

        if (key == global.KEY_RIGHT) {
            GameArea.move("RIGHT");
        }

    });

    window.addEventListener('resize', function () {
        GameArea.resize();
    })

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

    socket.on("log", function (datas) {
        log("[" + datas.emitter + "] - " + datas.message)
    });

    Logger.close();
});