import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isObjectIdOrHexString } from 'mongoose';
import { User, UserDocument } from './user.schema.js';

/** What the frontend name-picker needs. No Mongo internals leak out. */
export interface PublicUser {
  id: string;
  handle: string;
  displayName: string;
}

function toPublic(u: { _id: unknown; handle: string; displayName: string }): PublicUser {
  return { id: String(u._id), handle: u.handle, displayName: u.displayName };
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async findAll(): Promise<PublicUser[]> {
    const users = await this.userModel.find().sort({ displayName: 1 }).lean().exec();
    return users.map(toPublic);
  }

  async findById(id: string): Promise<PublicUser> {
    if (!isObjectIdOrHexString(id)) throw new NotFoundException('No such user');
    const user = await this.userModel.findById(id).lean().exec();
    if (!user) throw new NotFoundException('No such user');
    return toPublic(user);
  }

  /** Used by the Visits module to refuse visits recorded for unknown people. */
  async exists(id: string): Promise<boolean> {
    if (!isObjectIdOrHexString(id)) return false;
    return (await this.userModel.exists({ _id: id })) !== null;
  }
}
