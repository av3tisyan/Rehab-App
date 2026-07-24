import {
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { BODY_SIDES, GOAL_STATUSES, type BodySide, type GoalStatus } from '@rehab/shared';

export class CreateGoalDto {
  @IsUUID()
  episodeId!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @IsOptional()
  @IsISO8601()
  targetDate?: string;

  @IsOptional()
  @IsIn(GOAL_STATUSES)
  status?: GoalStatus;

  // Optional link to a measured metric (auto-progress).
  @IsOptional()
  @IsString()
  @MaxLength(32)
  metricTypeCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  metricBodyRegion?: string;

  @IsOptional()
  @IsIn(BODY_SIDES)
  metricSide?: BodySide;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  metricMeasureKind?: string;
}

export class UpdateGoalDto extends PartialType(CreateGoalDto) {}
