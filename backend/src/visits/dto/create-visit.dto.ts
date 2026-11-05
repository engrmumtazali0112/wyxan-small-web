import { IsIn, IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';
import { VISIT_VIA } from '../visit.schema.js';
import type { VisitVia } from '../visit.schema.js';

// Note: there is deliberately no "outcome" field. The server decides whether the
// address was shown or nowhere, so a client can't record a false fact.
export class CreateVisitDto {
  @IsMongoId()
  userId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  address: string;

  // how they got here: typed, link, back, forward, history, search, publish
  @IsIn(VISIT_VIA)
  via: VisitVia;
}
