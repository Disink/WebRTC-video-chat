let temp;
let socket = io();

let initiator_peer_list = {};
let receiver_peer_list = {};

let stream_camera_status = false;
let stream_screem_status = false;

let local_media_list = {};
let remote_media_list = {};

let params = new URLSearchParams(location.search);

let user_name = params.get('user_name');
let room_id = params.get('room_id');


navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(function(){
    navigator.mediaDevices.enumerateDevices().then(function(device){
        select_vue.video_input_device_list = device.filter((item, index) => item.kind == 'videoinput');
        select_vue.audio_input_device_list = device.filter((item, index) => item.kind == 'audioinput');
        select_vue.audio_output_device_list = device.filter((item, index) => item.kind == 'audiooutput');
    });
});

document.getElementById('select_device-box').style.marginLeft = -(document.getElementById('select_device-box').clientWidth / 2);

local_stream_vue.local_media_list = local_media_list;
remote_stream_vue.remote_media_list = remote_media_list;

socket.emit('join_room', {
    room_id: room_id,
    user_name: user_name
});

socket.on('joined_room', function(data){
    console.log('Joined room.');
});

socket.on('get_offer_from_server', function(data){
    console.log('Get offer.');

    let socket_id = data['socket_id'];
    let offer = data['offer'];
    let media_type = data['media_type'];

    if (!receiver_peer_list[socket_id]){
        receiver_peer_list[socket_id] = {};
    }

    receiver_peer_list[socket_id][media_type] = new SimplePeer({
        trickle: false,
    });

    let this_peer = receiver_peer_list[socket_id][media_type];

    this_peer.on('error', err => console.log('error', err))

    this_peer.on('signal', data => {
        answer = data;
        socket.emit('send_answer_to_server', {'socket_id': socket_id,
                                              'answer': answer,
                                              'media_type': media_type});

        console.log('Send answer.');
    });

    this_peer.on('data', data => {
        console.log('data: ' + data)
    });

    this_peer.signal(offer);

    this_peer.on('stream', stream => {
        console.log("Get Video stream.");

        if (!remote_media_list[socket_id]){
            remote_media_list[socket_id] = {}
        }

        remote_media_list[socket_id][media_type] = stream;
        remote_stream_vue.$forceUpdate();

    });

    this_peer.on('close', () => {
        console.log("Peer is closed.");
    });

});

socket.on('get_answer_from_server', function(data){
    console.log('Get answer.');

    let socket_id = data['socket_id'];
    let answer = data['answer'];
    let media_type = data['media_type'];

    let this_peer = initiator_peer_list[socket_id][media_type];

    this_peer.on('data', data => {
        console.log('data: ' + data)
    });

    this_peer.signal(answer);

});


document.getElementById('open_camera-button').addEventListener('click', function(){
    $('#select_device-box').show();
    document.getElementById('select_device-box').style.marginLeft = -(document.getElementById('select_device-box').clientWidth / 2);
    document.getElementById('select_device-box').style.opacity = 1;
});

document.getElementById('select_device_share-button').addEventListener('click', function(){
    socket.emit('client_stream_media', 'camera');
    $('#select_device-box').hide();
});

document.getElementById('select_device_cancel-button').addEventListener('click', function(){
    $('#select_device-box').hide();
});

document.getElementById('share_display-button').addEventListener('click', function(){
    socket.emit('client_stream_media', 'display');
});

socket.on('get_list_for_stream_media', function(data){

    let media_type = data['media_type'];
    let socket_list= data['socket_list'];

    let media;

    switch (media_type){
        case 'camera':
            media = navigator.mediaDevices.getUserMedia(select_vue.constraints);
            break;
        case 'display':
            media = navigator.mediaDevices.getDisplayMedia({video: true,audio: true});
            break;
    }

    media.then(
        function(stream){
            local_media_list[media_type] = stream;
            local_stream_vue.$forceUpdate();

            socket_list.forEach(function(socket_id){
                if (!initiator_peer_list[socket_id]){
                    initiator_peer_list[socket_id] = {};
                }

                initiator_peer_list[socket_id][media_type] = new SimplePeer({
                    initiator: true,
                    trickle: false,
                    stream: stream
                });

                let this_peer = initiator_peer_list[socket_id][media_type];

                this_peer.on('error', err => console.log('error', err))


                this_peer.on('signal', data => {
                    offer = data;
                    socket.emit('send_offer_to_server', {'socket_id': socket_id,
                                                         'offer': offer,
                                                         'media_type': media_type});

                    console.log('Send offer.');
                });


                this_peer.on('close', () => {
                    console.log("Peer is closed.");
                });
            });
        },
        function(){
            alert('Camera permission denied');
        });
});

socket.on('new_user_request_stream', function(data){
    socket_id = data['socket_id'];
    Object.keys(local_media_list).forEach(function(k,index){
        let stream = local_media_list[k];
        let media_type = k;

        if (!initiator_peer_list[socket_id]){
            initiator_peer_list[socket_id] = {};
        }

        initiator_peer_list[socket_id][media_type] = new SimplePeer({
            initiator: true,
            trickle: false,
            stream: stream
        });

        let this_peer = initiator_peer_list[socket_id][media_type];

        this_peer.on('error', err => console.log('error', err))

        this_peer.on('signal', data => {
            offer = data;
            socket.emit('send_offer_to_server', {'socket_id': socket_id,
                                                 'offer': offer,
                                                 'media_type': media_type});

            console.log('Send offer.');
        });

        this_peer.on('close', () => {
            console.log("Peer is closed.");
        });
    });
});
