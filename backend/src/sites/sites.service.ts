import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isValidAddress, normalizeAddress } from '../common/address.js';
import { SanitizeService } from '../sanitize/sanitize.service.js';
import { UsersService, type PublicUser } from '../users/users.service.js';
import { CreateSiteDto } from './dto/create-site.dto.js';
import { Site, SiteDocument } from './site.schema.js';

export interface PublicSite {
  address: string;
  title: string;
  /** Sanitized html: safe to store, still re-sanitized by the client before rendering. */
  html: string;
  author: PublicUser;
  updatedAt?: Date;
}

export interface PublishResult extends PublicSite {
  /** true when an existing page of the same author at this address was replaced */
  replaced: boolean;
}

function isDuplicateKey(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name) private readonly siteModel: Model<SiteDocument>,
    private readonly sanitize: SanitizeService,
    private readonly users: UsersService,
  ) {}

  /** GET: the page that lives at an address, or "Nowhere" (404). */
  async findByAddress(raw: string): Promise<PublicSite> {
    const address = normalizeAddress(raw);
    // An address that could never exist is just as much "nowhere" as one nobody published.
    if (!isValidAddress(address)) throw this.nowhere(address);

    const site = await this.siteModel.findOne({ address }).lean().exec();
    if (!site) throw this.nowhere(address);

    const author = await this.users.findById(String(site.author));
    return {
      address: site.address,
      title: site.title,
      html: site.html,
      author,
      updatedAt: site.updatedAt,
    };
  }

  /**
   * POST: publish a page. The raw html never touches the database: it is
   * sanitized first, and the search text is derived from the sanitized result.
   * Re-publishing your own address replaces the page; someone else's address is refused.
   */
  async publish(dto: CreateSiteDto): Promise<PublishResult> {
    const address = normalizeAddress(dto.address);
    if (!isValidAddress(address)) {
      throw new BadRequestException(
        'Address must look like "tidepool.zz": lowercase letters, digits and hyphens, ending in .zz',
      );
    }
    if (!(await this.users.exists(dto.authorId))) {
      throw new BadRequestException('Unknown author');
    }

    const title = this.sanitize.title(dto.title);
    const { html, text } = this.sanitize.process(dto.html);
    if (!title) throw new BadRequestException('Title is empty once markup is removed');
    if (!text) throw new BadRequestException('Page has no readable text once markup is removed');

    const author = new Types.ObjectId(dto.authorId);
    const existing = await this.siteModel.findOne({ address });
    let replaced = false;

    if (existing) {
      if (!existing.author.equals(author)) {
        throw new ConflictException(`${address} belongs to another author`);
      }
      existing.title = title;
      existing.html = html;
      existing.text = text;
      await existing.save();
      replaced = true;
    } else {
      try {
        await this.siteModel.create({ address, title, html, text, author });
      } catch (err) {
        // Two people publishing the same new address at the same moment.
        if (isDuplicateKey(err)) throw new ConflictException(`${address} was just taken`);
        throw err;
      }
    }

    return { ...(await this.findByAddress(address)), replaced };
  }

  /** Used by Visits to decide shown vs nowhere. */
  async exists(address: string): Promise<boolean> {
    return (await this.siteModel.exists({ address: normalizeAddress(address) })) !== null;
  }

  /** Used by Visits to label history rows with the page title. */
  async titlesByAddress(addresses: string[]): Promise<Map<string, string>> {
    if (addresses.length === 0) return new Map();
    const rows = await this.siteModel
      .find({ address: { $in: addresses } }, 'address title')
      .lean()
      .exec();
    return new Map(rows.map((r) => [r.address, r.title] as [string, string]));
  }

  private nowhere(address: string): NotFoundException {
    return new NotFoundException({ statusCode: 404, error: 'Nowhere', message: 'No such address', address });
  }
}
