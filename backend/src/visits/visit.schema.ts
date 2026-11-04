import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const VISIT_VIA = ['typed', 'link', 'back', 'forward', 'history', 'search', 'publish'] as const;
export type VisitVia = (typeof VISIT_VIA)[number];

export type VisitDocument = HydratedDocument<Visit>;

// Append-only: a Visit is a fact, never edited. History is derived from these.
@Schema({ collection: 'visits' })
export class Visit {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  // Stored as a plain string, not a Site ref: a visit to a dead address is still a visit.
  @Prop({ required: true, lowercase: true, trim: true, maxlength: 200 })
  address: string;

  @Prop({ required: true, enum: VISIT_VIA })
  via: VisitVia;

  @Prop({ required: true, enum: ['shown', 'nowhere'], default: 'shown' })
  outcome: 'shown' | 'nowhere';

  @Prop({ required: true, default: () => new Date() })
  visitedAt: Date;

  // Only set by the seed script, so re-seeding can upsert instead of duplicating.
  // Real visits never have it, so they can never collide.
  @Prop({ type: String, unique: true, sparse: true })
  seedKey?: string;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);

VisitSchema.index({ user: 1, visitedAt: -1 }); // "my history, newest first"
