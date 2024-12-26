import { FieldPacket, RowDataPacket } from "mysql2";
import { dbConnect } from "../../config/dbConfig";
import { redisClient } from "../../config/redisConfig";

export const getUserByIdService = async (userId: number) => {
  const cacheKey = `user:${userId}`;

  // Check if data exists in Redis cache
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  // If not in cache, fetch from database
  const [rows]: [RowDataPacket[], FieldPacket[]] = await (
    await dbConnect()
  ).execute("SELECT * FROM Users WHERE id = ?", [userId]);
  const userData = rows[0];

  // Store fetched data in Redis cache with an expiration time
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(userData)); // Expires in 1 hour

  return userData;
};
