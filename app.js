var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res) {
    res.sendFile(__dirname + '/templates/index.html');
});

app.get('/room',function(req, res) {
    if (!req.query.user_name || !req.query.room_id){
        res.redirect('/');
    }else if(/\w{4}/.test(req.query.room_id) && /\w{4}/.test(req.query.user_name)){
        res.sendFile(__dirname + '/templates/room.html');
    }else{
        res.sendFile(__dirname + '/templates/error.html');
    }
});

app.use('/static',express.static(__dirname + '/static'));


//serv.listen(2000, function(){
serv.listen(9900, () => {
   console.log("Server started.");
});

let socket_list = {};
let user_list = {};
let room_list = {};


var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    socket.id = Math.random();
    let self_id = socket.id;

    //const player_socket = new modules_player_socket(socket);
    //const user_socket = socket;

    let user = {}

    socket_list[self_id] = socket;
    user_list[self_id] = user;


    console.log('New socket connection' + self_id);

    socket.on('join_room', function(data){
        let room_id = data['room_id'];

        let user_name = data['user_name'];

        user['name'] = user_name;
        user['room_id'] = room_id;

        if (!room_list[room_id]){
            room_list[room_id] = [];
        }

        let room_user_socket_list = room_list[room_id];
        room_user_socket_list.push(self_id);
        // room_user_list[self_id] = user;

        room_user_socket_list_filter = room_user_socket_list.filter((item, index) => item !== self_id);
        socket.emit('joined_room', room_user_socket_list_filter);

        room_user_socket_list_filter.forEach(function(socket_id){
            socket_list[socket_id].emit('new_user_request_stream', {'socket_id': self_id});
        });

        console.log("User [%s] join room [%s]", user_name, room_id);
    });

    socket.on('client_stream_media', function(data){
        let room_user_socket_list = room_list[user['room_id']];
        //room_user_socket_list = room.filter((item, index) => item !== self_id);
        room_user_socket_list_filter = room_user_socket_list.filter((item, index) => item !== self_id);

        socket.emit('get_list_for_stream_media', {
            media_type: data,
            socket_list: room_user_socket_list_filter
        });
    });

    socket.on('send_offer_to_server', function(data){
        console.log("Get offer from client");

        socket_id = data['socket_id'];
        offer = data['offer'];
        media_type = data['media_type'];

        socket_list[socket_id].emit('get_offer_from_server', {'socket_id': self_id,
                                                              'offer': offer,
                                                              'media_type': media_type});

        console.log("Send offer to client");
    });

    socket.on('send_answer_to_server', function(data){
        console.log("Get answer from client");

        socket_id = data['socket_id']
        answer = data['answer']
        media_type = data['media_type'];


        socket_list[socket_id].emit('get_answer_from_server', {'socket_id': self_id,
                                                               'answer': answer,
                                                               'media_type': media_type});

        console.log("Send answer to client");
    });

    socket.on('disconnect',function(){
        console.log('User disconnection' + self_id);

        delete socket_list[self_id];
        delete user_list[self_id];

        let room_user_socket_list = room_list[user['room_id']];

        if(user['room_id']){
            room_list[user['room_id']] = room_user_socket_list.filter((item, index) => item !== self_id);
        }

        // console.log(socket_list);
        // console.log(JSON.stringify(user_list));
        // console.log(room_user_socket_list);
    });


});

