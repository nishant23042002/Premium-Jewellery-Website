import mongoose from "mongoose";
import { getServerEnv } from "@/config/env";
import { logger } from "@/lib/logger";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/**
 * Next.js reloads server modules on every request in dev, which would spin
 * up a new connection each time without this cache on the global object.
 */
declare global {
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global._mongooseCache) {
  global._mongooseCache = cache;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    const { MONGODB_URI } = getServerEnv();

    cache.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        // Fail fast on a down DB instead of hanging on Mongoose's ~30s
        // default — a serverless request shouldn't sit waiting that long.
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 20000,
      })
      .then((mongooseInstance) => {
        mongooseInstance.connection.on("error", (error) => {
          logger.error("mongoose", "connection error", { error });
        });
        mongooseInstance.connection.on("disconnected", () => {
          logger.warn("mongoose", "connection disconnected");
        });
        return mongooseInstance;
      });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null;
    logger.error("mongoose", "initial connection failed", { error });
    throw error;
  }

  return cache.conn;
}
