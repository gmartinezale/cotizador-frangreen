import mongoose, { Document, Schema } from "mongoose";

export interface IRateLimit extends Document {
  key: string;
  count: number;
  resetAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>({
  key: { type: String, required: true, unique: true, index: true },
  count: { type: Number, required: true, default: 1 },
  // TTL index: MongoDB automatically deletes the document after resetAt
  resetAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

const RateLimit =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);

export default RateLimit;
