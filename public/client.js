// DOM ELEMENTS
const boardCanvas = document.getElementById("board");
const ctx = boardCanvas.getContext("2d");
const statusElement = document.getElementById("status");
const roleElement = document.getElementById("role");
const resetBtn = document.getElementById("resetBtn");
const joinBtn = document.getElementById("joinBtn");
const nameInput = document.getElementById("nameInput");
const passwordInput = document.getElementById("passwordInput");

const CELL_SIZE = 200;

//const ws = new WebSocket(`ws://${window.location.host}`); // WEBSOCKET CONNECTION
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const ws = new WebSocket(`${protocol}//${window.location.host}`); // WEBSOCKET CONNECTION

let gameState = null; // Current game state
let role = "spectator"; // Player role

// Event Listener to place a game piece on board
boardCanvas.addEventListener("click", event => {

  if (role !== "X" && role !== "O") {
    return;
  }
  const rect = boardCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const col = Math.floor(x / 200);
  const row = Math.floor(y / 200);

  const index = row * 3 + col;
  ws.send(JSON.stringify({type: "place", index}));

}); // end 

// Draw X piece on game board
function drawX(x, y) {
  ctx.beginPath();
  ctx.moveTo(x + 30, y + 30);
  ctx.lineTo(x + 170, y + 170);
  ctx.moveTo(x + 170, y + 30);
  ctx.lineTo(x + 30,y + 170);
  ctx.stroke();
}

// Draw O piece on game board
function drawO(x, y) {
    ctx.beginPath();
    ctx.arc(x + 100, y + 100, 70, 0, Math.PI * 2);
    ctx.stroke();
}

// Draw Grid
function drawGrid() {
    ctx.lineWidth = 4;            // Line width = 4 px
    ctx.strokeStyle = "#000";  // Move this to style.css
    ctx.beginPath();              // Define a new path

    ctx.moveTo(200, 0);           // Line 1 start point
    ctx.lineTo(200, 600);         // Line 1 end point

    ctx.moveTo(400, 0);           // Line 2 start point
    ctx.lineTo(400, 600);         // Line 2 end point

    ctx.moveTo(0, 200);           // Line 3 start point
    ctx.lineTo(600, 200);         // Line 3 end point

    ctx.moveTo(0, 400);           // Line 4 start point
    ctx.lineTo(600, 400);         // Line 4 end point

    ctx.stroke();                 // Draws the lines
}

// DRAW BOARD
function drawBoard() {
  ctx.fillStyle ="#14c9f7ff"
  //ctx.clearRect(0, 0, 600, 600);
  ctx.fillRect(0, 0, 600, 600);
  
  // Draw grid
  drawGrid()

  // Draw pieces
  gameState.board.forEach((value, index) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const x   = col * CELL_SIZE;
    const y   = row * CELL_SIZE;

    if (value === "X") {
       drawX(x, y);
    } else if (value === "O") {
       drawO(x, y);
    }
  });

  if (gameState.winner) {
    statusElement.textContent = `Winner: ${gameState.winner}`;
  } else {
    statusElement.textContent = `Turn: ${gameState.currentPlayer}`;
  }
} // end of drawBoard()

// Receive server messages via WebSocket
ws.onmessage = event => {
  const data = JSON.parse(event.data);
  // Updated game state
  if (data.type === "state") {
    gameState = data.gameState;
    drawBoard();
  }

  // Role assignment
  if (data.type === "role") {
    role = data.role;
    roleElement.textContent = `Logged in as ${data.name} (${role})`;
  }
  // Error messages
  if (data.type === "error") {
    alert(data.message);
  }
}; // end of ws.onmessage

// Join Game Event Listener
joinBtn.addEventListener("click",() => {
    ws.send(JSON.stringify({type: "login",name: nameInput.value.trim(),
        password: passwordInput.value}));
  }
); // End of Join Game Event Listener

// Reset Game Event Listener
resetBtn.addEventListener("click", () => {
    ws.send(JSON.stringify({type: "reset"}));
  }
); // End of Reset Game Event Listener
