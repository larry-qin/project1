const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Store rooms and players
const rooms = new Map();
const players = new Map();

// Room management functions
function createRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            id: roomId,
            players: new Map(),
            gameState: {
                enemies: []
            }
        });
        console.log(`Room ${roomId} created`);
    }
    return rooms.get(roomId);
}

function removePlayerFromRoom(playerId) {
    const player = players.get(playerId);
    if (player && player.roomId) {
        const room = rooms.get(player.roomId);
        if (room) {
            room.players.delete(playerId);
            console.log(`Player ${playerId} removed from room ${player.roomId}`);

            // Broadcast player left to room
            io.to(player.roomId).emit('playerLeft', { playerId });

            // Clean up empty rooms
            if (room.players.size === 0) {
                rooms.delete(player.roomId);
                console.log(`Room ${player.roomId} cleaned up`);
            }
        }
    }
    players.delete(playerId);
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Handle room joining
    socket.on('joinRoom', (data) => {
        const { roomId, playerName } = data;
        const playerId = socket.id;

        // Create or get room
        const room = createRoom(roomId);

        // Add player to room and maps
        const playerData = {
            id: playerId,
            name: playerName,
            roomId: roomId,
            position: { x: 0, y: 1.6, z: 0 },
            rotation: { yaw: 0, pitch: 0 },
            weapon: 'pistol'
        };

        room.players.set(playerId, playerData);
        players.set(playerId, playerData);

        // Join socket room
        socket.join(roomId);

        // Send existing players to new player
        const existingPlayers = Array.from(room.players.values())
            .filter(p => p.id !== playerId);
        socket.emit('roomJoined', {
            playerId,
            existingPlayers,
            roomId
        });

        // Broadcast new player to existing players
        socket.to(roomId).emit('playerJoined', playerData);

        console.log(`Player ${playerName} (${playerId}) joined room ${roomId}`);
    });

    // Handle player updates
    socket.on('playerUpdate', (data) => {
        const player = players.get(socket.id);
        if (player) {
            // Update player data
            player.position = data.position;
            player.rotation = data.rotation;
            player.weapon = data.weapon;

            // Broadcast to other players in room
            socket.to(player.roomId).emit('playerUpdate', {
                playerId: socket.id,
                position: data.position,
                rotation: data.rotation,
                weapon: data.weapon
            });
        }
    });

    // Handle shooting events
    socket.on('playerShoot', (data) => {
        const player = players.get(socket.id);
        if (player) {
            // Broadcast shoot event to other players in room
            socket.to(player.roomId).emit('playerShoot', {
                playerId: socket.id,
                origin: data.origin,
                direction: data.direction,
                weapon: data.weapon
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        removePlayerFromRoom(socket.id);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Game lobby: http://localhost:${PORT}/lobby.html`);
});