import { redisClient } from "../../config/redisConfig";

export const getChatHistory = async (roomId: string) => {
  const cacheKey = `chatHistory:${roomId}`;

  // Check if chat history exists in Redis cache
  const cachedHistory = await redisClient.get(cacheKey);
  if (cachedHistory) {
    return JSON.parse(cachedHistory);
  }

  // If not in cache, fetch from database (implement your database logic here)
  const chatHistory = await fetchChatHistoryFromDatabase(roomId);

  // Store fetched chat history in Redis cache with an expiration time
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(chatHistory)); // Expires in 1 hour

  return chatHistory;
};

const fetchChatHistoryFromDatabase = async (roomId: string) => {
  // Implement your database fetching logic here
  // For example, using MySQL:
  // const [rows] = await dbConnection.execute('SELECT * FROM messages WHERE roomId = ?', [roomId]);
  // return rows;
  return []; // Placeholder
};
