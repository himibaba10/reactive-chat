export const config = {
  dbUrl: process.env.DB_URL,
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET as string,
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
};
