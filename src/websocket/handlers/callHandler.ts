import { Server, Socket } from "socket.io";
import redis from "../../config/redisConfig";

export const callHandler = (socket: Socket, io: Server) => {
  const userId = socket.handshake.query.userId;
  const CALLS_KEY = "calls";

  const getAllCalls = async (): Promise<any[]> => {
    const calls = await redis.lrange(CALLS_KEY, 0, -1);
    return calls.map((call) => JSON.parse(call));
  };

  const saveAllCalls = async (calls: any[]): Promise<void> => {
    await redis.del(CALLS_KEY);
    const pipeline = redis.pipeline();
    calls.forEach((call) => {
      pipeline.rpush(CALLS_KEY, JSON.stringify(call));
    });
    await pipeline.exec();
  };

  const callListUpdate = async () => {
    const calls = await getAllCalls();
    io.emit("call-list-update", calls);
  };

  socket.on("initiate-call", async (data: string) => {
    console.log(data);
    const parsedData = JSON.parse(data);
    const { roomId } = parsedData;

    const calls = await getAllCalls();
    const roomExists = calls.find((call) => call.roomId === roomId);

    if (roomExists) {
      return socket.emit("call-exists", roomId);
    }

    const newCall = {
      roomId,
      from: userId,
      status: "pending",
      to: null,
    };
    calls.push(newCall);
    await saveAllCalls(calls);

    // Console log room members
    console.log(roomId, io.sockets.adapter.rooms.get(roomId));
    callListUpdate();
  });

  socket.on("join-call", async (data: string) => {
    const parsedData = JSON.parse(data);
    const { roomId } = parsedData;

    const calls = await getAllCalls();
    const call = calls.find((call) => call.roomId === roomId);

    if (!call) {
      return socket.emit("call-not-found", roomId);
    }

    if (call.status !== "pending") {
      return socket.emit("call-not-pending", call);
    }

    call.status = "inProgress";
    call.to = userId;

    await saveAllCalls(calls);

    console.log(roomId, io.sockets.adapter.rooms.get(roomId));
    io.emit("call-joined", call);
    callListUpdate();
  });

  socket.on("hold-call", async (data: string) => {
    const parsedData = JSON.parse(data);
    const { roomId } = parsedData;

    const calls = await getAllCalls();
    const call = calls.find((call) => call.roomId === roomId);

    if (call?.status === "inProgress") {
      call.status = "onHold";

      await saveAllCalls(calls);

      io.emit("call-on-hold", call);
      callListUpdate();
    } else {
      socket.emit("call-not-in-progress", call);
    }
  });

  socket.on("resume-call", async (data: string) => {
    const parsedData = JSON.parse(data);
    const { roomId } = parsedData;

    const calls = await getAllCalls();
    const call = calls.find((call) => call.roomId === roomId);

    if (call?.status === "onHold") {
      call.status = "inProgress";
      call.to = userId;

      await saveAllCalls(calls);

      io.emit("call-resumed", call);
      callListUpdate();
    } else {
      socket.emit("call-not-on-hold", call);
    }
  });

  socket.on("end-call", async (data: string) => {
    const parsedData = JSON.parse(data);
    const { roomId } = parsedData;

    let calls = await getAllCalls();
    const call = calls.find((call) => call.roomId === roomId);

    if (call) {
      calls = calls.filter((call) => call.roomId !== roomId);
      await saveAllCalls(calls);

      io.emit("call-ended", call);
      callListUpdate();
    } else {
      socket.emit("call-not-found", roomId);
    }
  });

  socket.on("get-call-list", async () => {
    const calls = await getAllCalls();
    socket.emit("call-list-update", calls);
  });

  socket.on("peer-signal", (data) => {
    const { roomId, signal } = JSON.parse(data);
    io.to(roomId).emit("peer-signal", { userId, signal });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", userId);
  });
};
