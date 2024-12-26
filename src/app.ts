import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import { userRoutes } from "./api/routes/userRoutes";
import { dbConnect } from "./config/dbConfig";
import { port } from "./config/serverConfig";
import { callHandler } from "./websocket/handlers/callHandler";
import { healthCheckHandler } from "./websocket/handlers/healthCheck";

const app = express();
const server = createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use("/api", userRoutes);

// Database Connection
dbConnect()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });

    io.on("connection", (socket) => {
      console.log("User connected", socket.id);
      callHandler(socket);
      healthCheckHandler(socket);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
