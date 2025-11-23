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
            this.isHost = data.existingPlayers.length === 0; // Host if no existing players
            console.log(`✅ Joined room ${this.roomId} as ${this.playerId}`);
            console.log(`✅ Is host: ${this.isHost}`);
            console.log(`✅ Existing players:`, data.existingPlayers);

            // Notify game about host status
            if (window.onHostStatusChanged) {
                window.onHostStatusChanged(this.isHost);
            }

            // Add existing players to game
            data.existingPlayers.forEach(player => {
                console.log(`✅ Adding existing player:`, player);
                this.addNetworkPlayer(player);
            });
        });

        this.socket.on('playerJoined', (playerData) => {
            console.log(`✅ Player ${playerData.name} joined:`, playerData);
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

        this.socket.on('enemyUpdate', (data) => {
            // Update enemy positions from host
            if (window.onEnemyUpdate) {
                window.onEnemyUpdate(data);
            }
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

    // Send enemy update (only for host)
    sendEnemyUpdate(enemies) {
        if (!this.isConnected || !this.roomId) return;

        const enemyData = enemies.map(enemy => ({
            id: enemy.userData.id,
            position: {
                x: enemy.position.x,
                y: enemy.position.y,
                z: enemy.position.z
            },
            direction: enemy.userData.direction,
            alive: enemy.userData.alive
        }));

        this.socket.emit('enemyUpdate', { enemies: enemyData });
    }

    // Add network player to game
    addNetworkPlayer(playerData) {
        if (playerData.id === this.playerId) {
            console.log(`❌ Skipping self player: ${playerData.id}`);
            return;
        }

        console.log(`🔥 Creating network player:`, playerData);

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
        console.log(`🔥 Network players map now contains:`, Array.from(this.networkPlayers.keys()));

        // Trigger game to create visual representation
        if (window.onNetworkPlayerJoined) {
            console.log(`🔥 Calling onNetworkPlayerJoined callback`);
            window.onNetworkPlayerJoined(player);
        } else {
            console.log(`❌ No onNetworkPlayerJoined callback found!`);
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

// MultiplayerClient class is available globally