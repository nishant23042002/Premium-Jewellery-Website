import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import {
  deletedAtField,
  localizedTextSchema,
  tenantField,
} from "@/lib/db/schema-helpers";

const eventSchema = new Schema(
  {
    tenantId: tenantField,
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: localizedTextSchema(), required: true },
    description: { type: localizedTextSchema(), required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    imageUrl: { type: String },
    isPublished: { type: Boolean, default: false },
    deletedAt: deletedAtField,
  },
  { timestamps: true },
);

eventSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

export type EventDocument = InferSchemaType<typeof eventSchema>;

export const EventModel: Model<EventDocument> =
  models.Event ?? model<EventDocument>("Event", eventSchema);
