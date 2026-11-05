import { Controller, Get, Query } from '@nestjs/common';
import { SearchQueryDto } from './dto/search-query.dto.js';
import { SearchService } from './search.service.js';

@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  // GET /api/search?q=tides
  @Get()
  find(@Query() query: SearchQueryDto) {
    return this.search.search(query.q);
  }
}
