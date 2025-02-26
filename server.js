//all logics and actions related to server are defined in this file
import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
const PORT = process.env.PORT || 9000;

//to identify the file location
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const server = createServer(app);
const io = new Server(server);
const allUsers = {};

const __dirname = dirname(fileURLToPath(import.meta.url));   //import.meta.url is used to get the current file path

//exposing public directory to the outside world
app.use(express.static("public"));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'public/app/index.html'));
});        

// handle socket connection...   socket.on to recieve messages and socket.emit to send messages
io.on('connection', (socket) => {   
    console.log(`a user connected to socket and socket id is: ${socket.id}`);
    socket.on('join-user', (username) => {
        console.log(`User joined: ${username} `);
        allUsers[username] = {username, id: socket.id};
        //informing all users that a new user has joined
        io.emit("joined",allUsers);
    });

    socket.on('offer', ({from, to, offer}) => {
        console.log(`Offer received from ${from} to ${to}`);
        //ye server hai so ek client se aaya hua offer hume dusre client tak pahuchana hai
        io.to(allUsers[to].id).emit("offer", {from, to, offer});
    });

    socket.on('answer', ({from, to, answer}) => {
        console.log(`Answer received from ${from} to ${to}`);
        //ab hum from ko bhej raha hai
        io.to(allUsers[from].id).emit("answer", {from, to, answer});
    });

    socket.on("call-ended",caller=>{
          const [from,to] = caller;
          io.to(allUsers[from].id).emit("call-ended",caller);
          io.to(allUsers[to].id).emit("call-ended",caller);
    });

    socket.on('icecandidate', candidate => {
        console.log(`Ice candidate received from peer`);
        //broadcast to other peers. khud ko chod kar sabko bhejdo
        socket.broadcast.emit("icecandidate", candidate);
    });
    
    // Add this in the socket.on('connection', ...) block
    socket.on('audio-status-change', ({from, to, isMuted}) => {
        // Send to the other peer
        if (allUsers[to]) {
            io.to(allUsers[to].id).emit("remote-audio-status", {from, isMuted});
        }
    });

    socket.on('video-status-change', ({from, to, isVideoOff}) => {
        const toSocket = allUsers[to];
        if (toSocket) {
            io.to(toSocket.id).emit('video-status-change', {from, isVideoOff});
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        // Find and remove the disconnected user from allUsers
        let disconnectedUser = null;
        for (const username in allUsers) {
            if (allUsers[username].id === socket.id) {
                disconnectedUser = username;
                break;
            }
        }

        if (disconnectedUser) {
            console.log(`Removing user: ${disconnectedUser}`);
            delete allUsers[disconnectedUser];
            
            // Inform all remaining users that someone has left
            io.emit("user-left", {
                username: disconnectedUser,
                remainingUsers: allUsers
            });
        }
    });
    
});

server.listen(PORT, () => {      //agar app.listen karte to it was only for express, bas express hi listen kar pata tha, but now we have to listen to http as well as socket connection
  console.log(`Server is running on port ${PORT}`);
});