import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // where you write the frontend port
  },
});

const ROOM = "group";

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("joinRoom", async (userName) => {
    console.log(`${userName} is joining the group.`);

    await socket.join(ROOM);

    // send to all
    // io.to(ROOM).emit("joinNotice", userName);

    // brodcast means (joining user can not got joined message)
    socket.to(ROOM).emit("joinNotice", userName);
  });
  
  // chat message 
  socket.on("chatMessage", (msg) => {
    socket.to(ROOM).emit("chatMessage", msg);
  });

  //typing
  socket.on("typing", (userName) => {
    socket.to(ROOM).emit("typing", userName);
  });

  //stop typing
  socket.on("stopTyping", (userName) => {
    socket.to(ROOM).emit("stopTyping", userName);
  });

});

app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
