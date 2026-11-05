import { BadRequestException, Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateVisitDto } from './dto/create-visit.dto.js';
import { VisitsService } from './visits.service.js';

@Controller('visits')
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  // POST /api/visits  { userId, address, via }
  @Post()
  record(@Body() dto: CreateVisitDto) {
    return this.visits.record(dto);
  }

  // GET /api/visits/:userId?limit=200&before=2026-11-04T10:00:00Z  (newest first)
  @Get(':userId')
  history(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    const n = limit === undefined ? undefined : Number.parseInt(limit, 10);
    if (n !== undefined && Number.isNaN(n)) throw new BadRequestException('limit must be a number');
    return this.visits.history(userId, { limit: n, before });
  }
}
