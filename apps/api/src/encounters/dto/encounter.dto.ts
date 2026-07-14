import { IsInt, IsISO8601, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateEncounterDto {
  @IsUUID()
  episodeId!: string;

  @IsOptional()
  @IsISO8601()
  encounterDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sessionNumber?: number;

  @IsOptional()
  @IsString()
  subjective?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateEncounterDto extends PartialType(CreateEncounterDto) {}
