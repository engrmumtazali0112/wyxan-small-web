import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SitesModule } from '../sites/sites.module.js';
import { UsersModule } from '../users/users.module.js';
import { Visit, VisitSchema } from './visit.schema.js';
import { VisitsController } from './visits.controller.js';
import { VisitsService } from './visits.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Visit.name, schema: VisitSchema }]),
    UsersModule,
    SitesModule,
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
})
export class VisitsModule {}
