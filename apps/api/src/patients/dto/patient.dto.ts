import {
  IsEmail,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { PATIENT_SEXES, type PatientSex } from '@rehab/shared';

export class CreatePatientDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  lastName!: string;

  @IsOptional()
  @IsISO8601()
  dateOfBirth?: string;

  @IsOptional()
  @IsIn(PATIENT_SEXES)
  sex?: PatientSex;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  referringPhysician?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  heightCm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  bloodType?: string;

  @IsOptional()
  @IsIn(['left', 'right'])
  dominantHand?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePatientDto extends PartialType(CreatePatientDto) {}
