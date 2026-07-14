import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { BODY_SIDES, type BodySide } from '@rehab/shared';

/** A single measurement data point. */
export class AssessmentItemDto {
  @IsString()
  @MaxLength(32)
  typeCode!: string; // 'ROM', 'MMT', 'VAS', 'WEIGHT', ...

  @IsOptional()
  @IsString()
  @MaxLength(64)
  bodyRegion?: string;

  @IsOptional()
  @IsIn(BODY_SIDES)
  side?: BodySide;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  measureKind?: string; // 'flexion', 'abduction', 'deltoid', ...

  @IsOptional()
  @IsNumber()
  primaryValue?: number; // extracted from payload if omitted

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsISO8601()
  measuredAt?: string;
}

export class CreateAssessmentDto extends AssessmentItemDto {
  @IsUUID()
  encounterId!: string;
}

/** Bulk entry — e.g. all ROM motions of a joint captured in one screen. */
export class CreateAssessmentBulkDto {
  @IsUUID()
  encounterId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssessmentItemDto)
  items!: AssessmentItemDto[];
}
