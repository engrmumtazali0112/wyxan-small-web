import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateSiteDto } from './dto/create-site.dto.js';
import { SitesService } from './sites.service.js';

@Controller('sites')
export class SitesController {
  constructor(private readonly sites: SitesService) {}

  // GET /api/sites/tidepool.zz : the page at an address, or 404 "Nowhere"
  @Get(':address')
  findOne(@Param('address') address: string) {
    return this.sites.findByAddress(address);
  }

  // POST /api/sites : publish (or replace your own) page
  @Post()
  publish(@Body() dto: CreateSiteDto) {
    return this.sites.publish(dto);
  }
}
