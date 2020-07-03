// const express=require('express');
// const path=require('path');
// const http=require('http');

// const app=express();

// const socket=require('socket.io');
// const server=http.Server(app);

// app.use(express.static(path.join(__dirname,'client/public')));

// var server=app.listen(5000,()=>{
//     console.log('Server started');
// });
// const io=socket(server);


const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const path = require('path');
// var router = express.Router();

//     router.get('/', function(req, res, next) {  
//           res.status(200).send("Hi, It works!")  
//     }); 


app.use(express.static(path.join(__dirname, 'build')));


app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
const rooms={};
//const io=socket(server);
io.on('connection',(socket)=>
{
    console.log("Connected");
    
    socket.on("join room",(roomID)=>{
        console.log("User here");
        if(rooms[roomID])
            rooms[roomID].push(socket.id);
        else
            rooms[roomID]=[socket.id];
        const otherUser = rooms[roomID].find(id => id!==socket.id);
        
        socket.emit("other user",otherUser);

    });
    socket.on("call partner",(incoming)=>{
        console.log("call partner from server");
        const payload={
            CallerID:incoming.CallerID,
            signal:incoming.signal
        }
        io.to(incoming.PartnerID).emit("caller signal", payload);
    });
    socket.on("accept call",(incoming)=>{
        const payload={
            signal:incoming.signal
        }
        console.log("accept call");
        io.to(incoming.CallerID).emit("callee signal",payload);
    });
});
server.listen(process.env.PORT||5000);