import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const reservationProductRefSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
  },
  { _id: false },
);

const reservationActivitySchema = new Schema(
  {
    action: { type: String, required: true },
    note: { type: String },
    byAdminName: { type: String },
    at: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false },
);

const reservationSchema = new Schema(
  {
    tenantId: tenantField,
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    preferredDate: { type: Date, required: true },
    preferredTimeSlot: { type: String, required: true },
    branchId: { type: String, required: true },
    products: { type: [reservationProductRefSchema], default: [] },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    activityLog: { type: [reservationActivitySchema], default: [] },
  },
  { timestamps: true },
);

reservationSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
reservationSchema.index({ tenantId: 1, preferredDate: 1 });

export type ReservationDocument = InferSchemaType<typeof reservationSchema>;

export const ReservationModel: Model<ReservationDocument> =
  models.Reservation ??
  model<ReservationDocument>("Reservation", reservationSchema);
