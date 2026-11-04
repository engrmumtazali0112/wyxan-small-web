import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ADDRESS_REGEX } from '../common/address.js';

export type SiteDocument = HydratedDocument<Site>;

@Schema({ timestamps: true, collection: 'sites' })
export class Site {
  // The address is the identity of a site. One address, one page; an edit replaces it.
  @Prop({ required: true, unique: true, lowercase: true, trim: true, match: ADDRESS_REGEX })
  address: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  title: string;

  // SANITIZED html only. Raw input never reaches this field (enforced in Phase 2).
  @Prop({ required: true, maxlength: 100_000 })
  html: string;

  // Plain text derived from the sanitized html; this is what search indexes.
  @Prop({ required: true, default: '' })
  text: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  author: Types.ObjectId;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

// Search by what is written in the page, not just the title (title weighted higher).
SiteSchema.index(
  { title: 'text', text: 'text' },
  { weights: { title: 10, text: 1 }, name: 'site_text_search' },
);
