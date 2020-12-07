const Express = require("express")();
const Http = require("http").createServer(Express);
const io = require("socket.io")(Http, {
    cors: {
        origin: "*"
    }
});

let position = {
    x: 200,
    y: 200
}

let game_name = 'Football Team';
let game_id = '';
let games = [
    {
        'gameid':'54321',
        'players':[],
        'status':'stop'
    }
];

// let owner = 'a1b2c3';
let game = '';

io.on("connection", socket => {
    socket.emit("position", position);
    socket.on("game_id", data => {
        game_id = data;
        socket.join('gid='+game_id)
        io.to('gid='+game_id).emit("game_id", 'hi from ' + socket.id)
        // console.log(socket.rooms);
        let push_game = {
            'gameid':game_id,
            'players':[]
        };
        if ( !games.some(game => game.gameid === game_id) ) {
            games.push(push_game);
        }
        // console.log(games);
        game = games.find(game => game.gameid === game_id)

    });
    socket.on("new_player", data => {
        // let game = games.find(game => game.gameid === game_id)
        game.players.push(data);
        io.to('gid='+game_id).emit("update_players", game.players);
        // console.log(game.players);
    });
    socket.on("start_round", data => {
        // let game = games.find(game => game.gameid === game_id)
        game.status = 'round_'+data
        io.to('gid='+game_id).emit("game_status", game.status);
        // console.log(game.status);
    });
    socket.on("pick_made", ({ name, round, pick }) => {
        let player = game.players.find(player => player.name === name);
        player.picks.push( { 'round':round, 'pick':pick } );
        io.to('gid='+game_id).emit("counting_picks");
        setTimeout(() => {
            io.to('gid='+game_id).emit("round_results", 'win');
        }, 1000)
        console.log(game.players);
    });




    socket.on("game_name", data => {
        game_name = data;
        io.emit("game_name", game_name);
    });
    socket.on("move", data => {
        switch(data) {
            case "left":
                position.x -= 5;
                io.emit("position", position);
                break;
            case "right":
                position.x += 5;
                io.emit("position", position);
                break;
            case "up":
                position.y -= 5;
                io.emit("position", position);
                break;
            case "down":
                position.y += 5;
                io.emit("position", position);
                break;
            }
        });
});

Http.listen(process.env.PORT || '3000', () => {
    console.log("Listening at " + (process.env.PORT || 3000));
});