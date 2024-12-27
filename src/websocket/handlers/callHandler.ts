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
    };
    calls.push(newCall);
    await saveAllCalls(calls);

    socket.join(roomId);
    callListUpdate();
  });

  socket.on("accept-call", async (data: string) => {
    const parsedData = JSON.parse(data);
    const { roomId } = parsedData;

    const calls = await getAllCalls();
    const call = calls.find((call) => call.roomId === roomId);

    if (call?.status === "pending") {
      call.status = "inProgress";
      await saveAllCalls(calls);

      socket.to(roomId).emit("call-accepted", call);
      callListUpdate();
    } else {
      socket.emit("call-not-pending", call);
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

      socket.to(roomId).emit("call-ended", call);
      socket.leave(roomId);
      callListUpdate();
    } else {
      socket.emit("call-not-found", roomId);
    }
  });

  socket.on("hold-call", async (data: string) => {
    const parsedData = JSON.parse(data);
    const { roomId } = parsedData;

    const calls = await getAllCalls();
    const call = calls.find((call) => call.roomId === roomId);

    if (call?.status === "inProgress") {
      call.status = "onHold";
      await saveAllCalls(calls);

      socket.to(roomId).emit("call-on-hold", call);
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
      await saveAllCalls(calls);

      socket.to(roomId).emit("call-resumed", call);
      callListUpdate();
    } else {
      socket.emit("call-not-on-hold", call);
    }
  });

  socket.on("get-call-list", async () => {
    const calls = await getAllCalls();
    socket.emit("call-list-update", calls);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", userId);
  });
};
