const port = 3000
const rooms = []
const express = require('express')
const app = express()
const http = require('http');
const { SocketAddress } = require('net');
const server = http.createServer(app);
const { Server } = require("socket.io");
const { createWebSocketStream } = require('ws');
const io = new Server(server);

app.use(express.static("public"));



io.on('connection', (socket) => {
    console.log('a user connected');


    socket.on('disconnect', () => {
        console.log('user disconnected');
        if (socket.roomId !== undefined) {
            socket.leave(socket.roomId)
        }
      });

      socket.on('error', (err) => {
        console.log(err);
    });

    socket.on('join_room', ({id, word}) => {
        // Create room
        if (!io._nsps.get('/').adapter.rooms.get(id)){
            socket.roomId = id;
            console.log('Creating game...', socket.roomId);

            socket.join(socket.roomId);

            rooms[socket.roomId] = {};
            rooms[socket.roomId].host = socket.id;
            rooms[socket.roomId].players = [socket.id]
            rooms[socket.roomId].word = word
            console.log(rooms)

            console.log('Game created! ID: ', socket.roomId);
        }

        else if (io._nsps.get('/').adapter.rooms.get(id).size < 2) {
            socket.roomId = id
            socket.join(socket.roomId)
            rooms[socket.roomId].players.push(socket.id)
            socket.emit('word', rooms[socket.roomId].word)
            console.log(rooms)
        }

        else {
            socket.emit('Room Full')
        }
    })

    socket.on('set word', (word) => {
        rooms[socket.roomId].word = word;
    })

    socket.on('get word', () => {
        socket.emit('word', rooms[socket.roomId].word)
    })

    socket.on('update', ({id, colour}) => {
        socket.to(socket.roomId).emit('update', {id, colour})
    })

    socket.on('win', (word) => {
        socket.to(socket.roomId).emit('lose')
        io.to(rooms[socket.roomId].host).emit('restart')
    })
  });

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})