$(function () {
    var socket = io();

    var global = {
        KEY_UP: 38,
        KEY_DOWN: 40,
        KEY_LEFT: 37,
        KEY_RIGHT: 39,

        move_ratio: 2.5,

        gameWidth: 2500,
        gameHeight: 2500,

        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,

        xoffset: -0,
        yoffset: -0,

        lineColor: "#000",
    };

    var GameArea = {
        canvas: $("#game-canvas"),
        graph: null,

        resizeCanvas: function (canvas, w, h) {
            var c = canvas[0]
            c.width = w;
            c.height = h
        },

        resize: function () {
            global.screenWidth = window.innerWidth;
            global.screenHeight = window.innerHeight;

            this.resizeCanvas(this.canvas, global.screenWidth, global.screenHeight);
        },

        drawCircle: function (centerX, centerY, radius, color) {
            this.graph.beginPath();
            this.graph.globalAlpha = 1;
            this.graph.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);

            this.graph.fillStyle = color;
            this.graph.fill();
        },

        draw_grid: function () {
            this.graph.beginPath();

            this.graph.fillStyle = "#222222";
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

        draw_player: function() {
            this.drawCircle(global.screenWidth / 2, global.screenHeight / 2, 20, 
                "rgb(" + global.p_datas.color.r + ", " + global.p_datas.color.g + ", " + global.p_datas.color.b + ")");

            this.graph.font = "18px Arial";
            this.graph.textAlign = "center";
            this.graph.fillText(global.p_datas.username, global.screenWidth / 2, global.screenHeight / 2 + 50);

            this.graph.font = "18px Arial";
            this.graph.textAlign = "center";
            this.graph.fillText("{x: " + global.p_datas.x + " - y: " + global.p_datas.y + "}", global.screenWidth / 2, global.screenHeight / 2 + 80);
        },

        game_loop: function () {
            global.animLoopHandle = window.requestAnimFrame(GameArea.game_loop);

            GameArea.draw_grid();
            GameArea.draw_player();
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

            //log("[TheGAME] [client] - Coordonnées {x: " + global.p_datas.x + ", y: " + global.p_datas.y + "}");
        },

        start: function () {
            this.canvas.show();
            this.graph = this.canvas[0].getContext("2d");
            this.resize();

            this.game_loop();
        },
    }

    socket.on("EnterGameScreen", function (datas) {
        log("[TheGAME] [client] - Changement de vue Lobby => Jeu");

        global.p_datas = datas.p_datas;

        hideLobby();
        GameArea.start();
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

    function getMousePos(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    $(".play-button").click(function () {
        socket.emit("PlayGame", {
            username: $(".p_username").val()
        });
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