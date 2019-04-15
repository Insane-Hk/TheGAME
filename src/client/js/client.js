$(function () {
    var socket = io();

    var global = {
        KEY_UP: 38,
        KEY_DOWN: 40,
        KEY_LEFT: 37,
        KEY_RIGHT: 39,

        move_ratio: 1,

        gameWidth: 5000,
        gameHeight: 5000,

        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,

        xoffset: -0,
        yoffset: -0,

        lineColor: "#000",
    };

    var GameArea = {
        canvas: $("#game-canvas"),
        graph: null,

        resizeCanvas: function(canvas, w, h) {  
            var c = canvas[0]  
            c.width = w;  
            c.height = h  
        },

        resize: function()
        {
            global.screenWidth = window.innerWidth;
            global.screenHeight = window.innerHeight;

            this.resizeCanvas(this.canvas, global.screenWidth, global.screenHeight);
        },

        draw_grid: function()
        {
            this.graph.lineWidth = 1;
            this.graph.stokeStyle = "white";

            this.graph.beginPath();

            for (var x = global.xoffset - global.screenWidth / 2; x < global.screenWidth; x += global.screenHeight / 18) {
                this.graph.moveTo(x, 0);
                this.graph.lineTo(x, global.screenHeight);
            }
        
            for (var y = global.yoffset - global.screenHeight / 2 ; y < global.screenHeight; y += global.screenHeight / 18) {
                this.graph.moveTo(0, y);
                this.graph.lineTo(global.screenWidth, y);
            }

            this.graph.stroke();
        },

        game_loop: function()
        {
            global.animLoopHandle = window.requestAnimFrame(GameArea.game_loop);
            GameArea.draw_grid();
        },

        move: function(direction)
        {

        },

        start: function()
        {
            this.canvas.show();
            this.graph = this.canvas[0].getContext("2d");
            this.resize();

            this.game_loop();
        },
    }

    socket.on("EnterGameScreen", function(datas) {
        log("[TheGAME] [client] - Changement de vue Lobby => Jeu");

        hideLobby();
        GameArea.start();
    });

    function hideLobby() 
    {
        StopStorm();

        clearCanvas3();
        clearcanvas1();
        clearcanvas2();

        $("body").removeClass("thunder");

        
        $("#canvas1, #canvas2, #canvas3").hide();
        $(".game-logo").fadeOut(500);
        $(".game-menu").fadeOut(500);
        
        $("body").css("background-image","none");
        $("body").css("background-color","#222222");
    }

    function getMousePos(canvas, evt) 
    {
        var rect = canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left,
          y: evt.clientY - rect.top
        };
    }

    $(".play-button").click(function() {
        socket.emit("PlayGame", {username: $(".p_username").val()});
    });

    $(document).keydown(function(event) 
    { 
        var key = event.keyCode;

        if (key == global.KEY_UP)
        {
            console.log("UP")
        }

        if (key == global.KEY_DOWN)
        {
            console.log("DOWN")
        }

        if (key == global.KEY_LEFT)
        {
            console.log("LEFT")
        }

        if (key == global.KEY_RIGHT)
        {
            console.log("RIGHT")
        }
    }); 

    window.addEventListener('resize', function() {
        GameArea.resize();
        //GameArea.resizeCanvas(GameArea.canvas, window.innerWidth, window.innerHeight);
    })

    window.requestAnimFrame = (function() {
        return  window.requestAnimationFrame       ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                window.msRequestAnimationFrame     ||
                function( callback ) {
                    window.setTimeout(callback, 1000 / 60);
                };
    })();

    window.cancelAnimFrame = (function(handle) {
        return  window.cancelAnimationFrame     ||
                window.mozCancelAnimationFrame;
    })();

    socket.on("log", function(datas) {
        log("[" + datas.emitter + "] - " + datas.message)
    });

    Logger.close();
});