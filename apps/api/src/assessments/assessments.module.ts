import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { ComparisonController } from './comparison.controller';
import { ComparisonService } from './comparison.service';

@Module({
  controllers: [AssessmentsController, ComparisonController],
  providers: [AssessmentsService, ComparisonService],
  exports: [ComparisonService],
})
export class AssessmentsModule {}
