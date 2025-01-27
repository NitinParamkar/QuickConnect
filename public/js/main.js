//is file me clients (peers) jyo bhi actions perform karte hai uske bare me logic hai
const createUserBtn = document.getElementById('create-user');
const username = document.getElementById('username');
const allusersHtml = document.getElementById('allusers');
const socket = io();
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
let localStream;

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
        getInstance: () =>{
            if(!peerConnection){
                peerConnection = createPeerConnection();
            }
            return peerConnection;
        }
    }
})();

//handle browser events
createUserBtn.addEventListener('click', (e) => {
    if(username.value !== ""){
        const usernameContainer = document.querySelector('.username-input');
        socket.emit("join-user", username.value);
        usernameContainer.style.display = "none";
    }
});

//handle socket events
socket.on('joined', allusers => {
    const createUsersHtml = () => {
        allusersHtml.innerHTML = "";
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
          img.setAttribute("src", "/images/phone.png");
          img.setAttribute("width",20);
          button.appendChild(img);
          li.appendChild(button);
        }
        allusersHtml.appendChild(li);
     }
 }
createUsersHtml();
});

socket.on('offer', async({from, to , offer}) => {
    const pc= PeerConnection.getInstance();
    //set remote description
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", {from, to, answer: pc.localDescription});
});


socket.on('answer', async({from, to, answer}) => {
    const pc = PeerConnection.getInstance();
    await pc.setRemoteDescription(answer);
});

socket.on('icecandidate', async(candidate) => {
    const pc = PeerConnection.getInstance();
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
});

//start call method
//first of all we need to send an offer to the user we want to call in sdp (session description protocol) format which will be done with help of 
//signaling server as an intermideater, so through offer first 2 peers share their private keys
//they get to know their own public keys from STUN/TURN server
//once they get to know their public keys (ICE Candidates) they share it with each other
//then they can start the call
const startCall = async(user) => {
    console.log(`Call started to ${user}`);
    // socket.emit("start-call", {from: username.value, to});
    const pc = PeerConnection.getInstance();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", {from: username.value, to: user, offer: pc.localDescription});
     
};

//initialize app
const startMyVideo = async() => {
    try{
        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        localStream = stream;
        localVideo.srcObject = stream;
    }catch(err){
        console.error("Error getting user media: ", err);
    }   
}

startMyVideo();