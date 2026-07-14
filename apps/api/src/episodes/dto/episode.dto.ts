import { IsIn, IsISO8601, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { EPISODE_STATUSES, type EpisodeStatus } from '@rehab/shared';

export class CreateEpisodeDto {
  @IsUUID()
  patientId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsString()
  primaryComplaint?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  icd10Code?: string;

  @IsOptional()
  @IsIn(EPISODE_STATUSES)
  status?: EpisodeStatus;

  @IsOptional()
  @IsISO8601()
  startedAt?: string;
}

export class UpdateEpisodeDto extends PartialType(CreateEpisodeDto) {
  @IsOptional()
  @IsISO8601()
  dischargedAt?: string;
}
