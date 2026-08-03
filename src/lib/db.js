/**
 * Cached Mongoose connection for Next.js.
 *
 * Route Handlers can run as separate serverless invocations, so we cache the
 * connection (and in-flight connect promise) on `global` to avoid opening a
 * new pool on every request/hot-reload.
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
