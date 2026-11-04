import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  // Stable identity for seeding and lookups (no auth, just a pick-from-list name).
  @Prop({ required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9_-]{2,24}$/ })
  handle: string;

  @Prop({ required: true, trim: true, maxlength: 60 })
  displayName: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
