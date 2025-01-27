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
    });
});

server.listen(9000, () => {      //agar app.listen karte to it was only for express, bas express hi listen kar pata tha, but now we have to listen to http as well as socket connection
  console.log('Server is running on port 9000');
});