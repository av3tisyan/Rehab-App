import { Module } from '@nestjs/common';
import { AssessmentsModule } from '../assessments/assessments.module';
import { GoalsModule } from '../goals/goals.module';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { EpicrisisService } from './epicrisis.service';

@Module({
  imports: [AssessmentsModule, GoalsModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, EpicrisisService],
})
export class DocumentsModule {}
