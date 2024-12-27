import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import { userRoutes } from "./api/routes/healthcheck";
import { dbConnect } from "./config/dbConfig";
import { port } from "./config/serverConfig";
import { callHandler } from "./websocket/handlers/callHandler";
import { healthCheckHandler } from "./websocket/handlers/healthCheck";
import redis from "./config/redisConfig";
import cors from "cors";

const app = express();
const server = createServer(app);
const io: Server = new Server(server);

// Middleware
app.use(express.json());
app.use(cors());

// Redis Connection
redis.on("connect", () => {
  console.log("Redis connection established.");
});

redis.on("error", (err) => {
  return console.error("Redis connection error:", err);
});

// Database Connection
dbConnect()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    io.on("connection", (socket) => {
      const userId = socket.handshake.query.userId;
      console.log("User connected", userId);
      callHandler(socket, io);
      healthCheckHandler(socket);
    });
  })
  .catch((err) => {
    return console.error("Database connection failed:", err);
  });

// Routes
app.use("/healthcheck", userRoutes);
