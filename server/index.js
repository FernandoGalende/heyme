const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 8080 });

const clients = new Set();

wss.on("connection", (socket) => {
  clients.add(socket);
  console.log("Client connected. Total:", clients.size);

  socket.on("message", (data) => {
    // Send to all clients
    for (const client of clients) {
      if (client !== socket && client.readyState === 1) {
        client.send(data);
      }
    }
  });

  socket.on("close", () => {
    clients.delete(socket);
    console.log("Client disconnected, total:", clients.size);
  });
});

console.log("Signaling server running on ws://localhost:8080");
