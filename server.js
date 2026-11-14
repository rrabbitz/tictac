
// SERVER SETUP
const express = require("express");     // Express is used to serve the client files
const http = require("http");           // HTTP server used by both Express and WebSockets
const WebSocket = require("ws");        // WebSocket library for real-time communication
const app = express();                  // Create Express application
const server = http.createServer(app);  // Create HTTP serve
const wss = new WebSocket.Server({ server });  // Create WebSocket server

// Serve everything inside the public folder
app.use(express.static("public"));


// CONFIGURATION
const GAME_PASSWORD = "secret123";       // Password required to join the game


// GAME STATE
let gameState = {board: Array(9).fill(""), currentPlayer: "X", winner: null};
let players = {X: null, O: null};  // Track the two active players

// SEND GAME STATE TO EVERYONE
function broadcastState() {
  const payload = JSON.stringify({type: "state", gameState});

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// CHECK FOR WINNER
function checkWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

// NEW CLIENT CONNECTION
wss.on("connection", ws => {

  // Information about this connection
  ws.playerName = "";
  ws.role = "spectator";
  ws.authenticated = false;

  // Send current game state immediately
  ws.send(JSON.stringify({type: "state", gameState}));

  // RECEIVE MESSAGE
  ws.on("message", message => {

    const data = JSON.parse(message);
    if (data.type === "login") {               // if LOGIN message
      if (data.password !== GAME_PASSWORD) {   // Is password correct?
        ws.send(JSON.stringify({type: "error",message: "Invalid password"})); // Send error
        return;
      }

      // Save user information
      ws.playerName = data.name;
      ws.authenticated = true;

      // Assign player role
      if (!players.X) {
        players.X = ws;
        ws.role = "X";
      } else if (!players.O) {
        players.O = ws;
        ws.role = "O";
      } else {
        ws.role = "spectator";
      }

      // Inform client of assigned role
      console.log("role = " + ws.role + " for " + ws.playerName);
      ws.send(JSON.stringify({type: "role", role: ws.role, name: ws.playerName}));
      return;
    }

    // Ignore everything until authenticated
    if (!ws.authenticated) {
      return;
    }

    // Place a piece message
    if (data.type === "place") {
      console.log("player " + ws.role + " is trying to place a game piece");
      const index = data.index;
      // Must be X or O
      if (ws.role !== "X" && ws.role !== "O") {
        return;
      }
      // Must be player's turn
      if (ws.role !== gameState.currentPlayer) {
        return;
      }

      // Game already finished
      if (gameState.winner) {
        return;
      }

      // Cell already occupied
      if (gameState.board[index] !== "") {
        return;
      }

      // Place move
      gameState.board[index] = gameState.currentPlayer;

      const winner = checkWinner(gameState.board);

      if (winner) {
        gameState.winner = winner;
      } else {
        gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X";
      }
      broadcastState();
    }

    // RESET
    if (data.type === "reset") {
      gameState = {board: Array(9).fill(""), currentPlayer: "X", winner: null};
      broadcastState();
    }
  });

  // CLIENT DISCONNECTS
  ws.on("close", () => {
    if (players.X === ws) {
      players.X = null;
    }
    if (players.O === ws) {
      players.O = null;
    }
  });
});

// START SERVER
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {console.log(`Server running on port ${PORT}`);} );

//server.listen(3000, "0.0.0.0", () => {console.log("Server running at http://localhost:3000");});
