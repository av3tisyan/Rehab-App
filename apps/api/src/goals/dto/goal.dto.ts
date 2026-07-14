import { IsIn, IsISO8601, IsNumber, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { GOAL_STATUSES, type GoalStatus } from '@rehab/shared';

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
}

export class UpdateGoalDto extends PartialType(CreateGoalDto) {}
