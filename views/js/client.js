var session = '';
var stream_name = "video";
const interval = 5000;
window.startSession =(sessionId, token, appId) => {

	const queryString = window.location.search;
	
	const urlParams = new URLSearchParams(queryString);
	if(urlParams.has('stream_name')){
		stream_name = urlParams.get('stream_name')
	}

	var deferred = new $.Deferred();

	publisher_obj = OT.initPublisher("publisher", {
		insertMode: 'append',
		width: '100%',
		height: '100%',
		resolution: "640x480",
		name: stream_name
	});

	publisher_obj.on('videoInputDeviceChanged', (device) => {
		console.log('video device', device);
		console.log(`changing video device: ${device.label}`);
		});

	publisher_obj.on('audioInputDeviceChanged', (device) => {
		console.log('audio device', device);
		console.log(`changing audio device: ${device.label}`);
		});
		
	

	session = OT.initSession(appId, sessionId);
	session.connect(token, async function (err) {
		var currentVideoPackets;
		var currentAudioPackets;
		var tempDisconnectedFlag = false;
		if (err) {
			console.log(err);
			deferred.resolve(false);
		} else {
			// await publisher.applyVideoFilter({
			// 	type: 'backgroundBlur',
			// 	blurStrength: 'high',
			// });
			session.publish(publisher_obj, () => transformStream(publisher));
			//session.publish(publisher);
			
			deferred.resolve(true);
			//subscribe to other's stream
			session.on('streamCreated', function (event) {				
				console.log("Stream UP")
				var subscriber = session.subscribe(event.stream, event.stream.name == "vonage_maxine"?"maxine":"subscriber", {
					insertMode: 'append',
					width: '100%',
					height: '100%',
					resolution: "640x480",
				});
				var subsid = subscriber.id
				var timerID
				stream = event.stream;
				function getStat() {
					subscriber.getStats( (error, stats) =>{
						if(error){
							console.log("Error on Get Subscriber Stat with subscriber ID", subsid,"\n", error)
						}else{
							console.log("Stats for subscriber ID", subsid,"\n", stats)
							console.log("Stream Audio is ",stream.hasAudio)
							console.log("Stream Video is ",stream.hasVideo)
							if(!stream.hasAudio && !stream.hasVideo){
								
							}
							else if(stream.hasAudio && !stream.hasVideo){
									//the user is temporarily disconnected if both video and audio packets are not being received
								if((stats.audio.packetsReceived == currentAudioPackets)  ){
									//only mention disconnected status once
									if(!tempDisconnectedFlag){
										console.log("Subscriber ",subsid," is temporarily disconnected");
										//set temp disconnected flag to true
										tempDisconnectedFlag = true;
									}
								}else{
									//all good
									currentAudioPackets = stats.audio.packetsReceived;
									//only mention reconnection status once
									if (tempDisconnectedFlag){
										console.log("Subscriber ",subsid," has reconnected");
										//set temp disconnected flag to false
										tempDisconnectedFlag = false;
									}
								}

							}

							else if(!stream.hasAudio && stream.hasVideo){
									//the user is temporarily disconnected if both video and audio packets are not being received
								if((stats.video.packetsReceived == currentVideoPackets) ){
									//only mention disconnected status once
									if(!tempDisconnectedFlag){
										console.log("Subscriber ",subsid," is temporarily disconnected");
										//set temp disconnected flag to true
										tempDisconnectedFlag = true;
									}
								}else{
									//all good	
									currentVideoPackets = stats.video.packetsReceived;
									//only mention reconnection status once
									if (tempDisconnectedFlag){
										console.log("Subscriber ",subsid," has reconnected");
										//set temp disconnected flag to false
										tempDisconnectedFlag = false;
									}
								}
							}
							else if(stream.hasAudio && stream.hasVideo){
									//the user is temporarily disconnected if both video and audio packets are not being received
								if((stats.audio.packetsReceived == currentAudioPackets) && 
									(stats.video.packetsReceived == currentVideoPackets) ){
									//only mention disconnected status once
									if(!tempDisconnectedFlag){
										console.log("Subscriber ",subsid," is temporarily disconnected");
										//set temp disconnected flag to true
										tempDisconnectedFlag = true;
									}
								}else{
									//all good
									currentAudioPackets = stats.audio.packetsReceived;
									currentVideoPackets = stats.video.packetsReceived;
									//only mention reconnection status once
									if (tempDisconnectedFlag){
										console.log("Subscriber ",subsid," has reconnected");
										//set temp disconnected flag to false
										tempDisconnectedFlag = false;
									}
								}
							}
						}

					});
				}
				timerID = setInterval(getStat, interval);

				subscriber.on("connected", function (event){
					console.log("Subscriber Connected", event)

				});

				subscriber.on("disconnected", function (event){
					console.log("Subscriber disconnected", event)
				});

				subscriber.on("destroyed", function (event){
					console.log("SUBS DESTROYED: ", event)
					clearInterval(timerID);
				})

			});
			session.on('streamDestroyed', function (event) {
				
			});
			
		}
	});
	return deferred.promise();
}
try {
} catch (e) {
	console.log('No session yet');
}