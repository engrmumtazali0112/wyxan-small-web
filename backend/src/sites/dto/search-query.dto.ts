import { IsString, MaxLength } from 'class-validator';

export class SearchQueryDto {
  // Missing or repeated (?q=a&q=b) fails IsString, so the service only ever sees a string.
  @IsString()
  @MaxLength(100)
  q: string;
}
