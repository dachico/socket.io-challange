import { createServer } from "http";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { Server as socketServer } from "socket.io";
import log from "@ajar/marker";
import dotenv from "dotenv";
dotenv.config();

const { PORT, HOST, CLIENT_URL } = process.env;

const app = express();
const httpServer = createServer(app);
const io = new socketServer(httpServer, {
  cors: {
    // <-- this is relevant to tcp
    origin: CLIENT_URL,
    // origin: "http://localhost:5173",
  },
});

// express app middleware
app.use(cors()); // <-- this is relevant to http
app.use(morgan("dev"));
app.use(express.json());

// express routing
app.get("/", (req, res) => {
  res.status(200).send("Hello Express");
});

io.on("connection", (socket) => {
  socket.on("typing", ({ id, room }) => {
    socket.to(room).emit("typing", { id });
  });

  socket.on("stopped-typing", ({ id, room }) => {
    socket.to(room).emit("stopped-typing", { id });
  });

  log.debug("client connected ");
  // const cookie = socket.handshake.headers.cookie;
  // log.v('cookie:',cookie);

  log.yellow("socket.id:", socket.id);
  // log.obj(socket,'socket: ');

  socket.emit("server-msg", { message: "welcome to the chat" });

  socket.on("client-msg", ({ room, message }) => {
    log.obj({ room, message }, "client-msg: ");

    if (!room || room === "general") {
      // send to all clients (public chat)
      io.sockets.emit("server-msg", { message });
    } else {
      // send to clients in the room
      io.to(room).emit("server-msg", { message });
    }

    /* // Shorter version
    const targetClient = !room || room === 'general' ? io.sockets : io.to(room);
    targetClient.emit("server-msg", { message }); */
  });

  socket.on("join-room", ({ room }) => {
    io.to(room).emit("server-msg", {
      message: `Say hi to ${socket.id} joining the ${room} room.`,
    });
    socket.join(room);
    socket.emit("server-msg", { message: `Welcome to the ${room} room.` });
  });

  socket.on("leave-room", ({ room }) => {
    socket.leave(room);
    socket.emit("server-msg", { message: `You left the ${room} room.` });
    io.to(room).emit("server-msg", {
      message: `${socket.id} left the ${room} room.`,
    });
  });
});

httpServer.listen(PORT, HOST, () => {
  console.log("listening on *:3000");
  log.magenta(`server is live on`, `  ✨ ⚡  http://${HOST}:${PORT} ✨ ⚡`);
});
