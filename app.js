const Express = require("express")();
const Http = require("http").createServer(Express);
const io = require("socket.io")(Http, {
    cors: {
        origin: "*"
    }
});

// let position = {
//     x: 200,
//     y: 200
// }

let game_name = 'Football Team';
let game_id = '';
let games = [
    {
        'gameid':'54321',
        'players':[],
        'status':'lobby'
    }
];

// let owner = 'a1b2c3';
let game = '';
let pool = [
    'xklv.gif',
    'vegg.gif',
    'obgb.gif',
    'mopb.gif',
    'nqlg.gif',
    'yihr.gif',
    'walj.gif',
    'knhv.gif',
    'zsgq.gif',
    'relg.gif',
    'llyv.gif',
    'aflb.gif',
    'nzfp.gif',
    'jcfj.gif',
    'bipw.gif',
    'heoy.gif',
    'wred.gif',
    'bgse.gif',
    'ilcx.gif',
    'uuzq.gif',
    'zvho.gif',
    'exmd.gif',
    'vwpx.gif'
    ]
let backendVersion = Date.now();
io.on("connection", socket => {
    socket.emit('backend_version', backendVersion);
    socket.on("game_id", data => {
        game_id = data;
        socket.join('gid='+game_id)
        let shuffled = pool.map(x => x).sort(() => Math.random() - 0.5).slice(0,12);
        let starter = { round: 1, items: shuffled }
        let push_game = {
            'gameid':game_id,
            'gamename':'The PsyCatos',
            'players':[],
            'status':'lobby',
            'round':1,
            'ontime':false,
            'winning':null,
            'rounds':[starter],
            'gamemode':'popular'
        };
        if ( !games.some(game => game.gameid === game_id) ) {
            games.push(push_game);
        }
        game = games.find(game => game.gameid === game_id);
        io.to('gid='+game_id).emit("game_id", 'hi from ' + socket.id)
        socket.emit("game_name", { 'gamename': game.gamename, 'rounds': game.rounds, 'backend_version': backendVersion, 'gamemode': game.gamemode } )
    });
    socket.on("new_player", ({ newPlayer, gId }) => {
        game_id = gId;
        game = games.find(game => game.gameid === game_id);
        game.players.push(newPlayer);
        io.to('gid='+game_id).emit("update_players", game);
        // console.log(game.players);
        // console.log(JSON.stringify(game.players));
    });
    socket.on("user_exist", ({ clientId, gId }) => {
        console.log('user_exist triggered');
        game_id = gId;
        game = games.find(game => game.gameid === game_id);
        let existing = game.players.find(player => player.clientId === clientId);
        if (existing !== undefined) {
            socket.emit("existing_user", { 'existing': existing, 'players': game.players, 'game': game });
        } else {
            socket.emit("not_user");
        }
    });    
    socket.on("start_round", ({ round, gId }) => {
        game_id = gId;
        game = games.find(game => game.gameid === game_id);
        game.status = 'round';
        game.round = round;
        game.players.forEach((player) => {
            player.picks.push( { 'round':round, 'pick':-2 } );
        });
        let playersCount = game.players.length;
        console.log(playersCount);
        // console.log(JSON.stringify(game.players));
        // io.to('gid='+game_id).emit("game_status", { 'status': game.status, 'round': game.round });
        io.to('gid='+game_id).emit("round_starts", { 'status': game.status, 'round': game.round, 'players_count': playersCount });
        game.ontime = true;
        // server countdown 1
        setTimeout(() => {
            game.ontime = false;
            io.to('gid='+game_id).emit("counting_picks");
        }, 11500)
        // server countdown 2
        // server countdown 2 -> check_missing -> push vote to player.picks
        setTimeout(() => {
            game.status = 'result';
            let picksArray = [];
            let resultArray = [];
            game.players.forEach((player) => {
                let playerPick = player.picks.find(picks => picks.round === round);
                if (playerPick !== undefined) {
                    picksArray.push({ item:playerPick.pick, count:1 })
                }
            });
            picksArray.forEach(function (a) {
                if (!this[a.item]) {
                    this[a.item] = { item: a.item, count: 0 };
                    resultArray.push(this[a.item]);
                }
                this[a.item].count += a.count;
            }, Object.create(null));
            let orderedArray = resultArray.sort((a, b) => parseFloat(b.count) - parseFloat(a.count));
            const mias = orderedArray.filter(e => parseFloat(e.item) === -2 );
            const afks = orderedArray.filter(e => parseFloat(e.item) === -1 );
            // console.log(JSON.stringify(mias));
            // console.log(JSON.stringify(afks));
            // console.log(JSON.stringify(dolos));
            // console.log(JSON.stringify(populars));
            // console.log(JSON.stringify(unpops));
            if (game.gamemode === 'popular') {
                const dolos = orderedArray.filter(e => (parseFloat(e.count) === 1) && (parseFloat(e.item) >= 0) );
                const populars = orderedArray.filter(e => (parseFloat(e.count) >= 2) && (parseFloat(e.item) >= 0) );
                const winners = populars.filter(e => parseFloat(e.count) === parseFloat(populars[0].count) );
                game.players.forEach((player) => {
                    let playerPick = player.picks.find(picks => picks.round === round);
                    if (winners[0]) {
                        if (winners.length == 3) {
                            if ((parseFloat(playerPick.pick) === parseFloat(winners[0].item)) || (parseFloat(playerPick.pick) === parseFloat(winners[1].item)) || (parseFloat(playerPick.pick) === parseFloat(winners[2].item))) {
                                player.score += 10;
                                playerPick.result = 'won';
                            }
                        } else if (winners.length == 2) {
                            if ((parseFloat(playerPick.pick) === parseFloat(winners[0].item)) || (parseFloat(playerPick.pick) === parseFloat(winners[1].item))) {
                                player.score += 10;
                                playerPick.result = 'won';
                            }
                        } else {
                            if (parseFloat(playerPick.pick) === parseFloat(winners[0].item)) {
                                player.score += 10;
                                playerPick.result = 'won';
                            }
                        }
                    } if (dolos[0]) {
                        let isADolo = dolos.filter(e => parseFloat(e.item) === playerPick.pick)
                        if (isADolo[0]) {
                            playerPick.result = 'loss';
                        }
                    } if (afks[0]) {
                        if (parseFloat(playerPick.pick) === -1) {
                            playerPick.result = 'afk';
                        }
                    } if (mias[0]) {
                        if (parseFloat(playerPick.pick) === -2) {
                            playerPick.result = 'mia';
                        }
                    }
                });
                // console.log(JSON.stringify(game.players));
                if (winners[0]) {
                    game.winning = parseFloat(winners[0].item)
                } else {
                    game.winning = null
                }
            } else if (game.gamemode === 'unpopular') {
                const unpops = orderedArray.filter(e => (parseFloat(e.count) >= 1) && (parseFloat(e.item) >= 0) );
                let undolos = [];
                if (unpops[0]) {
                    if (unpops[unpops.length - 1].count !== 1){
                        undolos = orderedArray.filter(e => (parseFloat(e.count) >= 1) && (parseFloat(e.item) >= 0) && (parseFloat(e.count) !== parseFloat(unpops[unpops.length - 1].count)));
                    } else {
                        undolos = orderedArray.filter(e => (parseFloat(e.count) >= 2) && (parseFloat(e.item) >= 0) && (parseFloat(e.count) !== parseFloat(unpops[unpops.length - 1].count)));
                    }
                }
                // const undolos = unpops.filter(e => parseFloat(e.count) !== parseFloat(unpops[unpops.length - 1].count) );
                const unwinners = unpops.filter(e => parseFloat(e.count) === parseFloat(unpops[unpops.length - 1].count) );
                // console.log(JSON.stringify(unpops) + ' unpops');
                // console.log(JSON.stringify(undolos) + ' undolos');
                // console.log(JSON.stringify(unwinners) + ' unwinners');
                // console.log(game.players);
                game.players.forEach((player) => {
                    let playerPick = player.picks.find(picks => picks.round === round);
                    // console.log(playerPick);
                    if (unwinners[0]) {
                        if (unwinners.length == 3) {
                            if ((parseFloat(playerPick.pick) === parseFloat(unwinners[0].item)) || (parseFloat(playerPick.pick) === parseFloat(unwinners[1].item)) || (parseFloat(playerPick.pick) === parseFloat(unwinners[2].item))) {
                                player.score += 10;
                                playerPick.result = 'won';
                            }
                        } else if (unwinners.length == 2) {
                            if ((parseFloat(playerPick.pick) === parseFloat(unwinners[0].item)) || (parseFloat(playerPick.pick) === parseFloat(unwinners[1].item))) {
                                player.score += 10;
                                playerPick.result = 'won';
                            }
                        } else {
                            if (parseFloat(playerPick.pick) === parseFloat(unwinners[0].item)) {
                                player.score += 10;
                                playerPick.result = 'won';
                            }
                        }
                    } if (undolos[0]) {
                        let isADolo = undolos.find(e => parseFloat(e.item) === playerPick.pick)
                        if (isADolo !== undefined) {
                            playerPick.result = 'loss';
                        }
                    } if (afks[0]) {
                        if (parseFloat(playerPick.pick) === -1) {
                            playerPick.result = 'afk';
                        }
                    } if (mias[0]) {
                        if (parseFloat(playerPick.pick) === -2) {
                            playerPick.result = 'mia';
                        }
                    }
                });
                console.log(JSON.stringify(game.players));
                if (unwinners[0]) {
                    game.winning = parseFloat(unwinners[0].item)
                } else {
                    game.winning = null
                }
            }
            io.to('gid='+game_id).emit("round_results", { 'players': game.players, 'winning': game.winning });
        }, 11600)
    });
    // pick_made
    socket.on("pick_made", ({ name, round, pick, gId }) => {
        game_id = gId;
        game = games.find(game => game.gameid === game_id);
        if (game.ontime) {
            let player = game.players.find(player => player.name === name);
            // push vote to player.picks
            let roundObject = player.picks.find(objectPick => objectPick.round === round);
            roundObject.pick = pick;
        }
    });
    socket.on("next_round", ({ round, gId }) => {
        let numberParsed = parseInt(round, 10);
        game_id = gId;
        game = games.find(game => game.gameid === game_id);
        game.status = 'lobby';
        game.round = (numberParsed + 1);
        let shuffled = pool.map(x => x).sort(() => Math.random() - 0.5).slice(0,12);
        let shuffled_round = { round: game.round, items: shuffled }
        game.rounds.push(shuffled_round)
        let gamemode = oddOrEven(game.round);
        game.gamemode = gamemode;
        io.to('gid='+game_id).emit("game_status", { 'status': game.status, 'round': game.round, 'rounds': game.rounds, 'gamemode': gamemode });
    });
    socket.on("kick_player", ({ playerId, gId }) => {
        game_id = gId;
        game = games.find(game => game.gameid === game_id);
        let playerIndex = game.players.findIndex(player => player.clientId === playerId);
        if (playerIndex > -1) {
            game.players.splice(playerIndex, 1);
            io.to('gid='+game_id).emit("update_players", game);
        }


    });





    socket.on("game_name", data => {
        game_name = data;
        io.emit("game_name", game_name);
    });
    // socket.on("move", data => {
    //     switch(data) {
    //         case "left":
    //             position.x -= 5;
    //             io.emit("position", position);
    //             break;
    //         case "right":
    //             position.x += 5;
    //             io.emit("position", position);
    //             break;
    //         case "up":
    //             position.y -= 5;
    //             io.emit("position", position);
    //             break;
    //         case "down":
    //             position.y += 5;
    //             io.emit("position", position);
    //             break;
    //     }
    // });

// io.on connection ends here
});


// [{"name":"Ava","emoji":"1F973","type":"author","score":0,"picks":[{"round":1,"pick":"2"}]}]

function oddOrEven(x) {
    return ( x & 1 ) ? "popular" : "unpopular";
}

Http.listen(process.env.PORT || '3000', () => {
    console.log("Listening at " + (process.env.PORT || 3000));
});



// {
//     "gameid": "22222",
//     "players": [{
//         "name": "Ava",
//         "emoji": "1F61C",
//         "type": "author",
//         "score": 0,
//         "clientId" : '',
//         "picks": [{
//             "round": 1,
//             "pick": "NA"
//         }]
//     }, {
//         "name": "Avauui",
//         "emoji": "1F92F",
//         "type": "invited",
//         "score": 0,
//         "clientId" : '',
//         "picks": [{
//             "round": 1,
//             "pick": "1",
//             "end": "1st"
//         }]
//     }],
//     "status": "round",
//     "round": 1,
//     "ontime": true
// }

    // socket.on("play_time", ({ gId }) => {
    //     game_id = gId;
    //     game = games.find(game => game.gameid === game_id);
    //     console.log(game.ontime);
    //     let play_time = true;
    //     setTimeout(() => {
    //         play_time = false;
    //     }, 4500)
    //     socket.on("pick_time", () => {
    //         if (play_time) {
    //             console.log('on_time');
    //         } else {
    //             console.log('off_time');
    //         }
    //     });
    // });
