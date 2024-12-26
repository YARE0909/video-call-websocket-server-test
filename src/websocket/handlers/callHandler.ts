import { Socket } from "socket.io";

const calls: {
  roomId: string;
  from: string;
  status: "pending" | "inProgress" | "onHold";
}[] = [];

export const callHandler = (socket: Socket) => {
  socket.on("initiate-call", (data: string) => {
    // Parse the stringified JSON data
    const parsedData = JSON.parse(data);
    const { roomId } = parsedData;

    // Check if room already exists, if room exits notify the user
    const roomExists = calls.find((call) => call.roomId === roomId);
    if (roomExists) {
      return socket.emit("call-exists", roomId);
    }

    calls.push({
      roomId,
      from: socket.id,
      status: "pending",
    });
    socket.join(roomId);
    socket.emit("activeCalls", calls);
  });

  socket.on("accept-call", (data: string) => {
    const parsedData = JSON.parse(data);
    const { roomId } = parsedData;

    const call = calls.find((call) => call.roomId === roomId);
    if (call?.status === "pending") {
      call.status = "inProgress";
      socket.to(roomId).emit("call-accepted", call);
      socket.emit("activeCalls", calls);
    }
  });

  socket.on("end-call", (data: string) => {
    const parsedData = JSON.parse(data);
    const { roomId } = parsedData;

    const call = calls.find((call) => call.roomId === roomId);
    if (call) {
      calls.filter((call) => call.roomId !== roomId);
      socket.to(roomId).emit("call-ended", call);
      socket.leave(roomId);
      socket.emit("activeCalls", calls);
    }
  });

  socket.on("hold-call", (data: string) => {
    const parsedData = JSON.parse(data);
    const { roomId } = parsedData;

    const call = calls.find((call) => call.roomId === roomId);
    if (call?.status === "inProgress") {
      call.status = "onHold";
      socket.to(roomId).emit("call-on-hold", call);
      socket.emit("activeCalls", calls);
    }
  });

  socket.on("resume-call", (data: string) => {
    const parsedData = JSON.parse(data);
    const { roomId } = parsedData;

    const call = calls.find((call) => call.roomId === roomId);
    if (call?.status === "onHold") {
      call.status = "inProgress";
      socket.to(roomId).emit("call-resumed", call);
      socket.emit("activeCalls", calls);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
};
