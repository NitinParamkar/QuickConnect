//all logics and actions related to server are defined in this file
import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';

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
    res.sendFile(join(__dirname, '/app/index.html'));
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

    socket.on("end-call", ({from, to}) => {
        io.to(allUsers[to].id).emit("end-call", {from, to});
    });

    socket .on("call-ended",caller=>{
          const [from,to] = caller;
          io.to(allUsers[from].id).emit("call-ended",caller);
          io.to(allUsers[to].id).emit("call-ended",caller);
    });

    socket.on('icecandidate', candidate => {
        console.log(`Ice candidate received from peer`);
        //broadcast to other peers. khud ko chod kar sabko bhejdo
        socket.broadcast.emit("icecandidate", candidate);
       
    });
});

server.listen(9000, () => {      //agar app.listen karte to it was only for express, bas express hi listen kar pata tha, but now we have to listen to http as well as socket connection
  console.log('Server is running on port 9000');
});