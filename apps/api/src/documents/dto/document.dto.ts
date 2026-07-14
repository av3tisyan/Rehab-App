import { IsIn, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { DOCUMENT_TYPES, type DocumentType } from '@rehab/shared';

export class UpsertDocumentDto {
  @IsUUID()
  episodeId!: string;

  @IsIn(DOCUMENT_TYPES)
  type!: DocumentType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsObject()
  content!: Record<string, unknown>;
}
