import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { normalizeAddress } from '../common/address.js';
import { SitesService } from '../sites/sites.service.js';
import { UsersService } from '../users/users.service.js';
import { CreateVisitDto } from './dto/create-visit.dto.js';
import { Visit, VisitDocument } from './visit.schema.js';

export interface PublicVisit {
  id: string;
  address: string;
  /** Title of the page at that address, or null if it is nowhere. */
  title: string | null;
  via: string;
  outcome: string;
  visitedAt: Date;
}

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

function toPublic(
  v: { _id: unknown; address: string; via: string; outcome: string; visitedAt: Date },
  titles: Map<string, string>,
): PublicVisit {
  return {
    id: String(v._id),
    address: v.address,
    title: titles.get(v.address) ?? null,
    via: v.via,
    outcome: v.outcome,
    visitedAt: v.visitedAt,
  };
}

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(Visit.name) private readonly visitModel: Model<VisitDocument>,
    private readonly users: UsersService,
    private readonly sites: SitesService,
  ) {}

  /**
   * Append one fact: this person arrived at this address, this way, now.
   * Visits are never edited or deleted. Whether the address was shown or
   * nowhere is decided here, from the database, not by the caller.
   */
  async record(dto: CreateVisitDto): Promise<PublicVisit> {
    if (!(await this.users.exists(dto.userId))) throw new BadRequestException('Unknown user');

    const address = normalizeAddress(dto.address);
    if (!address) throw new BadRequestException('Address is empty');

    const outcome = (await this.sites.exists(address)) ? 'shown' : 'nowhere';
    const visit = await this.visitModel.create({
      user: new Types.ObjectId(dto.userId),
      address,
      via: dto.via,
      outcome,
      visitedAt: new Date(),
    });

    const titles = await this.sites.titlesByAddress([address]);
    return toPublic(visit, titles);
  }

  /** One person's history, newest first. `before` pages further back in time. */
  async history(userId: string, opts: { limit?: number; before?: string } = {}): Promise<PublicVisit[]> {
    await this.users.findById(userId); // 404 for an unknown person

    const limit = Math.min(Math.max(opts.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const user = new Types.ObjectId(userId);

    let filter: { user: Types.ObjectId; visitedAt?: { $lt: Date } } = { user };
    if (opts.before) {
      const before = new Date(opts.before);
      if (Number.isNaN(before.getTime())) throw new BadRequestException('before must be an ISO date');
      filter = { user, visitedAt: { $lt: before } };
    }

    const rows = await this.visitModel
      .find(filter)
      .sort({ visitedAt: -1, _id: -1 }) // _id breaks ties so equal timestamps stay in a stable order
      .limit(limit)
      .lean()
      .exec();

    const titles = await this.sites.titlesByAddress([...new Set(rows.map((r) => r.address))]);
    return rows.map((r) => toPublic(r, titles));
  }
}
