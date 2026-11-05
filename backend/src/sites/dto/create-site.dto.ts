import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_HTML_LENGTH } from '../../sanitize/sanitize.policy.js';

export class CreateSiteDto {
  // e.g. "tidepool.zz"; normalised and checked against the address rules in the service
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  address: string;

  // raw title; the service strips markup and caps it at 120 characters
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  // raw, untrusted html; sanitized in the service before it is stored
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_HTML_LENGTH)
  html: string;

  // "who is publishing": the picked name (no auth in this app)
  @IsMongoId()
  authorId: string;
}
