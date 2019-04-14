$(function () {
    var socket = io();

    $(".play-button").click(function() {
        socket.emit("PlayGame", {username: $(".p_username").val()});
    });
});