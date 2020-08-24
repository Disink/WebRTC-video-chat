            let display_vue = new Vue({
                el: '#display-box',
                data: {
                    selected_stream_array_list: [],
                },
                mounted: function(){},
                updated: function(){
                    console.log('display-box is updated.');
                    let selected_stream_array_list = this.selected_stream_array_list;

                        selected_stream_array_list.forEach(function(media, index){
                                let el = document.getElementById("display-video-" + index);
                                console.log("display-video-" + index);
                                el.srcObject = selected_stream_array_list[index];
                                el.onclick = function(){
                                    let this_index = index;
                                    selected_stream_array_list.splice(this_index, 1)
                                    console.log("Delete: " + this_index);
                                }
                        });
                }
            });


            let select_vue = new Vue({
                el: '#select_device-box',
                data: {
                    constraints: {video: {}, audio: {}},
                    video_input_device_list: {},
                    audio_input_device_list: {},
                    audio_output_device_list: {}
                },
                mounted: function(){},
                updated: function(){
                    console.log('select_device-box is updated.');
                    constraints = this.constraints;
                    constraints['video']['deviceId'] = document.getElementById("video_input_device-select").value;
                    constraints['audio']['deviceId'] = document.getElementById("audio_input_device-select").value;
                    navigator.mediaDevices.getUserMedia(constraints).then(function(stream){
                        document.getElementById('select_device-video').srcObject = stream;

                        document.getElementById("video_input_device-select").onchange = function(){
                            let device_id = this.value;
                            select_vue.constraints['video'] = {deviceId: device_id};
                            navigator.mediaDevices.getUserMedia(constraints).then(function(stream){
                                document.getElementById('select_device-video').srcObject = stream;
                            });
                        }

                        document.getElementById("audio_input_device-select").onchange = function(){
                            let device_id = this.value;
                            select_vue.constraints['audio'] = {deviceId: device_id};
                            navigator.mediaDevices.getUserMedia(constraints).then(function(stream){
                                document.getElementById('select_device-video').srcObject = stream;
                            });
                        }
                    },
                    function(){
                        alert('Camera permission denied');
                    });

                },
            });

            let local_stream_vue = new Vue({
                el: '#local_stream_list-box',
                data: {
                    // local_media_list: local_media_list
                    local_media_list: {}
                },
                mounted: function(){},
                updated: function(){
                    console.log('local_stream_list-box updated.');
                    let media_list = this.local_media_list;
                    Object.keys(media_list).forEach(function(media_type, index){
                        let el = document.getElementById("local_" + media_type + "-video");
                        el.srcObject = local_media_list[media_type];
                        el.onclick = function(){
                            display_vue.selected_stream_array_list.push(local_media_list[media_type]);
                        };
                    });
                }
            });

            let remote_stream_vue = new Vue({
                el: '#remote_stream_list-box',
                data: {
                    // remote_media_list: remote_media_list
                    remote_media_list: {}
                },
                mounted: function(){},
                updated: function(){
                    console.log('remote_stream_list-box updated.');
                    let media_list = this.remote_media_list;

                    Object.keys(media_list).forEach(function(peer_id, index){
                        Object.keys(media_list[peer_id]).forEach(function(media_type, index){
                            let el = document.getElementById(peer_id + "_remote_" + media_type + "-video");
                            el.srcObject = remote_media_list[peer_id][media_type];
                            el.onclick = function(){
                                display_vue.selected_stream_array_list.push(remote_media_list[peer_id][media_type]);
                            };
                        });
                    });
                }
            });
