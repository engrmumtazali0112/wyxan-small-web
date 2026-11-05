import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SanitizeModule } from '../sanitize/sanitize.module.js';
import { UsersModule } from '../users/users.module.js';
import { SearchController } from './search.controller.js';
import { SearchService } from './search.service.js';
import { Site, SiteSchema } from './site.schema.js';
import { SitesController } from './sites.controller.js';
import { SitesService } from './sites.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Site.name, schema: SiteSchema }]),
    SanitizeModule,
    UsersModule,
  ],
  controllers: [SitesController, SearchController],
  providers: [SitesService, SearchService],
  exports: [SitesService],
})
export class SitesModule {}
