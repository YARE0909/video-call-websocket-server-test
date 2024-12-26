import { Socket } from "socket.io";

export const healthCheckHandler = (socket: Socket) => {
  socket.on("healthCheck", () => {
    console.log("Health check received");
    socket.emit("healthCheck", "Server is up and running!");
  });
};
