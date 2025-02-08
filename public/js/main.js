//is file me clients (peers) jyo bhi actions perform karte hai uske bare me logic hai
const createUserBtn = document.getElementById('create-user');
const username = document.getElementById('username');
const allusersHtml = document.getElementById('allusers');
const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const endCallBtn = document.getElementById('end-call-btn');
const localUserLabel = document.getElementById('local-user-label');
const remoteUserLabel = document.getElementById('remote-user-label');
const localMuteBtn = document.getElementById('local-mute-btn');
const remoteMuteBtn = document.getElementById('remote-mute-btn');
const localVideoBtn = document.getElementById('local-video-btn');
const remoteVideoBtn = document.getElementById('remote-video-btn');
let isLocalMuted = false;
let isLocalVideoOff = false;
let localStream;
let caller = [];
let isJoined = false;
let remoteUserMuted = false;
let remoteVideoOff = false;

//Single Method for peer connection
//khud ka public ip jannane ke liye below code hai
const PeerConnection =(function(){
    let peerConnection;
    const createPeerConnection = () => {
        const config = {
            iceServers: [
                {
                    urls: ['stun:stun.l.google.com:19302']
                }
            ]
        };
        peerConnection = new RTCPeerConnection(config);

        //add local (audio/video) stream to peer connection
        localStream.getTracks().forEach(track => {  
            peerConnection.addTrack(track, localStream);
        });

        //listen to remote stream and add to peer connection
        peerConnection.ontrack = function(event){
            remoteVideo.srcObject = event.streams[0];
        }
        //listen for ice candidate
        peerConnection.onicecandidate = function(event){
            if(event.candidate){
                //jaise hi hume ice candidate milta hai, hum use socket server ke through bhejte hain (its public key that we send)
                socket.emit("icecandidate", event.candidate);
            }
        } 
        return peerConnection;
    }

    return {
        getInstance: () => {
            // Create new instance if none exists or if current one is closed
            if(!peerConnection || peerConnection.connectionState === 'closed') {
                peerConnection = createPeerConnection();
            }
            return peerConnection;
        },
        // Add method to clear the instance
        clearInstance: () => {
            if(peerConnection) {
                peerConnection.close();
                peerConnection = null;
            }
        }
    }
})();

// Add menu toggle functionality
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.querySelector('.close-menu');
    const callerList = document.querySelector('.caller-list-wrapper');
    const body = document.body;

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'menu-overlay';
    body.appendChild(overlay);

    function toggleMenu() {
        callerList.classList.toggle('active');
        overlay.classList.toggle('active');
        menuToggle.classList.toggle('hide');
    }

    menuToggle.addEventListener('click', toggleMenu);
    closeMenu.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);
});

const toggleLocalAudio = () => {
    if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            isLocalMuted = !isLocalMuted;
            audioTrack.enabled = !isLocalMuted;
            
            // Update button image
            const muteImg = localMuteBtn.querySelector('img');
            muteImg.src = isLocalMuted ? '/images/mute.png' : '/images/unmute.png';
            muteImg.alt = isLocalMuted ? 'Unmute' : 'Mute';

            // Notify the remote peer about mute status change
            if (caller.length === 2) {
                const [from, to] = caller;
                const remotePeer = from === username.value ? to : from;
                socket.emit('audio-status-change', {
                    from: username.value,
                    to: remotePeer,
                    isMuted: isLocalMuted
                });
            }
        }
    }
};

const toggleLocalVideo = () => {
    if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            isLocalVideoOff = !isLocalVideoOff;
            videoTrack.enabled = !isLocalVideoOff;
            
            // Update button image
            const videoImg = localVideoBtn.querySelector('img');
            videoImg.src = isLocalVideoOff ? '/images/video-off.png' : '/images/video-on.png';
            videoImg.alt = isLocalVideoOff ? 'Turn Video On' : 'Turn Video Off';

            // Notify the remote peer about video status change
            if (caller.length === 2) {
                const [from, to] = caller;
                const remotePeer = from === username.value ? to : from;
                socket.emit('video-status-change', {
                    from: username.value,
                    to: remotePeer,
                    isVideoOff: isLocalVideoOff
                });
            }
        }
    }
};

localMuteBtn.addEventListener('click', toggleLocalAudio);
localVideoBtn.addEventListener('click', toggleLocalVideo);

//handle browser events
createUserBtn.addEventListener('click', (e) => {
    const nameInput = username.value.trim();
    if(nameInput === "") {
        alert("Please enter your name to join");
        return;
    }

    const usernameContainer = document.querySelector('.username-input');
    socket.emit("join-user", nameInput);
    usernameContainer.style.display = "none";
    localUserLabel.textContent = `${nameInput} (You)`;
    isJoined = true; // Set join status to true
    
    // Refresh the users list now that we're joined
    socket.emit("request-users-list");
});

endCallBtn.addEventListener("click",(e)=>{
    socket.emit("call-ended",caller);
});

socket.on('remote-audio-status', ({from, isMuted}) => {
    remoteUserMuted = isMuted;
    // Update remote mute button UI
    const muteImg = remoteMuteBtn.querySelector('img');
    muteImg.src = isMuted ? '/images/mute.png' : '/images/unmute.png';
    muteImg.alt = isMuted ? 'Muted' : 'Unmuted';
    
    // Optionally show a notification or visual indicator
    const remoteLabel = document.getElementById('remote-user-label');
    remoteLabel.textContent = `${from} ${isMuted ? '(Muted)' : ''}`;
});

socket.on('video-status-change', ({from, isVideoOff}) => {
    remoteVideoOff = isVideoOff;
    const videoImg = remoteVideoBtn.querySelector('img');
    videoImg.src = isVideoOff ? '/images/video-off.png' : '/images/video-on.png';
    videoImg.alt = isVideoOff ? 'Video Off' : 'Video On';
});

//handle socket events
socket.on('joined', allusers => {
    const createUsersHtml = () => {
        allusersHtml.innerHTML = "";
        if (!isJoined) {
            // If user hasn't joined, show message
            const div = document.createElement('div');
            div.className = 'not-joined-message';
            div.textContent = 'Please enter your name and join to see other users';
            allusersHtml.appendChild(div);
            return;
        }
        for(const user in allusers){
          const li = document.createElement('li');
          li.textContent = `${user} ${user === username.value ? '(You)' : ''}`;
          if(user !== username.value){
          const button = document.createElement('button');
          button.classList.add("call-btn");
          button.addEventListener('click', (e) => {
              startCall(user);
          });
          const img = document.createElement('img');
          img.setAttribute("src", "/images/phone-call.png");
          img.setAttribute("width",35);
          button.appendChild(img);
          li.appendChild(button);
        }
        allusersHtml.appendChild(li);
     }
 }
createUsersHtml();
});

socket.on('offer', async({from, to, offer}) => {
    const pc = PeerConnection.getInstance();
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", {from, to, answer: pc.localDescription});
    caller = [from, to];
    remoteUserLabel.textContent = from;
    endCallBtn.classList.remove('d-none');
    remoteMuteBtn.style.display = 'flex';
    remoteVideoBtn.style.display = 'flex';
    
    // Reset remote mute state for new call
    remoteUserMuted = false;
    const muteImg = remoteMuteBtn.querySelector('img');
    muteImg.src = '/images/unmute.png';
    muteImg.alt = 'Unmute';
});

socket.on('answer', async({from, to, answer}) => {
    const pc = PeerConnection.getInstance();
    await pc.setRemoteDescription(answer);
    //show end call button
    endCallBtn.classList.remove('d-none');
    socket.emit("end-call", {from, to});
    caller=[from , to];
    remoteMuteBtn.style.display = 'flex';
    remoteVideoBtn.style.display = 'flex';
});

socket.on('icecandidate', async(candidate) => {
    const pc = PeerConnection.getInstance();
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
});



socket.on("call-ended", (caller) => {
    endCall();
});

//start call method
//first of all we need to send an offer to the user we want to call in sdp (session description protocol) format which will be done with help of 
//signaling server as an intermideater, so through offer first 2 peers share their private keys
//they get to know their own public keys from STUN/TURN server
//once they get to know their public keys (ICE Candidates) they share it with each other
//then they can start the call
const startCall = async(user) => {
    if (!isJoined) {
        alert("Please join the network before making calls");
        return;
    }
    console.log(`Call started to ${user}`);
    const pc = PeerConnection.getInstance();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", {from: username.value, to: user, offer: pc.localDescription});
    remoteUserLabel.textContent = user;
    endCallBtn.classList.remove('d-none');
    remoteMuteBtn.style.display = 'flex';
    remoteVideoBtn.style.display = 'flex';
    
    // Reset remote mute state for new call
    remoteUserMuted = false;
    const muteImg = remoteMuteBtn.querySelector('img');
    muteImg.src = '/images/unmute.png';
    muteImg.alt = 'Unmute';
};

const endCall = () => {
    PeerConnection.clearInstance();
    endCallBtn.classList.add('d-none');
    remoteMuteBtn.style.display = 'none';
    remoteVideoBtn.style.display = 'none';

    if (isLocalMuted) {
        toggleLocalAudio();
    }
    
    // Reset remote mute state
    remoteUserMuted = false;
    const muteImg = remoteMuteBtn.querySelector('img');
    muteImg.src = '/images/unmute.png';
    muteImg.alt = 'Unmute';

    // Clear the remote video stream
    if(remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
    }
    remoteUserLabel.textContent = '';
};

//initialize app
const startMyVideo = async() => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        localStream = stream;
        localVideo.srcObject = stream;
        // Ensure audio is enabled by default
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = true;
        }
    } catch(err) {
        console.error("Error getting user media: ", err);
    }   
};

remoteMuteBtn.style.display = 'none';
remoteVideoBtn.style.display = 'none';

startMyVideo();