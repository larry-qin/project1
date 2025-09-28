// Multiplayer client for 3D FPS game
class MultiplayerClient {
    constructor() {
        this.socket = null;
        this.playerId = null;
        this.roomId = null;
        this.playerName = null;
        this.networkPlayers = new Map();
        this.isConnected = false;
        this.lastPositionUpdate = 0;
        this.positionUpdateInterval = 50; // 20 updates per second
    }

    // Connect to server
    connect(serverUrl = window.location.origin) {
        if (this.socket) {
            this.disconnect();
        }

        this.socket = io(serverUrl);
        this.setupEventListeners();
    }

    // Setup Socket.IO event listeners
    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            this.networkPlayers.clear();
        });

        this.socket.on('roomJoined', (data) => {
            this.playerId = data.playerId;
            this.roomId = data.roomId;
            console.log(`Joined room ${this.roomId} as ${this.playerId}`);

            // Add existing players to game
            data.existingPlayers.forEach(player => {
                this.addNetworkPlayer(player);
            });
        });

        this.socket.on('playerJoined', (playerData) => {
            console.log(`Player ${playerData.name} joined`);
            this.addNetworkPlayer(playerData);
        });

        this.socket.on('playerLeft', (data) => {
            console.log(`Player ${data.playerId} left`);
            this.removeNetworkPlayer(data.playerId);
        });

        this.socket.on('playerUpdate', (data) => {
            this.updateNetworkPlayer(data);
        });

        this.socket.on('playerShoot', (data) => {
            this.handleNetworkPlayerShoot(data);
        });
    }

    // Join a room
    joinRoom(roomId, playerName) {
        if (!this.isConnected) {
            console.error('Not connected to server');
            return false;
        }

        this.roomId = roomId;
        this.playerName = playerName;

        this.socket.emit('joinRoom', {
            roomId: roomId,
            playerName: playerName
        });

        return true;
    }

    // Send player position update
    sendPlayerUpdate(position, rotation, weapon) {
        if (!this.isConnected || !this.roomId) return;

        const now = Date.now();
        if (now - this.lastPositionUpdate < this.positionUpdateInterval) return;

        this.socket.emit('playerUpdate', {
            position: position,
            rotation: rotation,
            weapon: weapon
        });

        this.lastPositionUpdate = now;
    }

    // Send shooting event
    sendShootEvent(origin, direction, weapon) {
        if (!this.isConnected || !this.roomId) return;

        this.socket.emit('playerShoot', {
            origin: origin,
            direction: direction,
            weapon: weapon
        });
    }

    // Add network player to game
    addNetworkPlayer(playerData) {
        if (playerData.id === this.playerId) return;

        // Create player entity using existing enemy system patterns
        const player = {
            id: playerData.id,
            name: playerData.name,
            position: playerData.position,
            rotation: playerData.rotation,
            weapon: playerData.weapon,
            mesh: null // Will be created by game
        };

        this.networkPlayers.set(playerData.id, player);

        // Trigger game to create visual representation
        if (window.onNetworkPlayerJoined) {
            window.onNetworkPlayerJoined(player);
        }
    }

    // Update network player data
    updateNetworkPlayer(data) {
        const player = this.networkPlayers.get(data.playerId);
        if (player) {
            player.position = data.position;
            player.rotation = data.rotation;
            player.weapon = data.weapon;

            // Trigger game to update visual representation
            if (window.onNetworkPlayerUpdate) {
                window.onNetworkPlayerUpdate(player);
            }
        }
    }

    // Handle network player shooting
    handleNetworkPlayerShoot(data) {
        const player = this.networkPlayers.get(data.playerId);
        if (player) {
            // Trigger game to show shoot effects
            if (window.onNetworkPlayerShoot) {
                window.onNetworkPlayerShoot(player, data.origin, data.direction, data.weapon);
            }
        }
    }

    // Remove network player
    removeNetworkPlayer(playerId) {
        const player = this.networkPlayers.get(playerId);
        if (player) {
            // Trigger game to remove visual representation
            if (window.onNetworkPlayerLeft) {
                window.onNetworkPlayerLeft(player);
            }
            this.networkPlayers.delete(playerId);
        }
    }

    // Disconnect from server
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.playerId = null;
        this.roomId = null;
        this.networkPlayers.clear();
    }

    // Get list of network players
    getNetworkPlayers() {
        return Array.from(this.networkPlayers.values());
    }

    // Check if connected
    isMultiplayerActive() {
        return this.isConnected && this.roomId;
    }
}

// Global multiplayer client instance
window.multiplayerClient = new MultiplayerClient();