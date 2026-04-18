import Redis from "ioredis";
import { config } from "./index";

const makeClient = (): Redis => {
  return new Redis(config.redisUrl, {
    lazyConnect: true, // don't connect until .connect() is called
    retryStrategy: (times) => {
      if (times >= 3) return null; // give up after 3 attempts
      return times * 300;
    },
  });
};

export const pubClient = makeClient();
export const subClient = makeClient();

export const connectRedis = async (): Promise<boolean> => {
  try {
    await pubClient.connect();
    await subClient.connect();
    console.log("Redis connected");
    return true;
  } catch {
    console.warn("Redis unavailable — running in single-instance mode (no Redis adapter)");
    return false;
  }
};
