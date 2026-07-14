import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { DocumentType } from '@rehab/shared';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { DocumentsService } from './documents.service';
import { EpicrisisService } from './epicrisis.service';
import { UpsertDocumentDto } from './dto/document.dto';

@ApiTags('documents')
@ApiBearerAuth()
@Controller()
export class DocumentsController {
  constructor(
    private readonly documents: DocumentsService,
    private readonly epicrisis: EpicrisisService,
  ) {}

  @Get('documents')
  list(
    @CurrentUser() user: AuthUser,
    @Query('episodeId', ParseUUIDPipe) episodeId: string,
    @Query('type') type?: DocumentType,
  ) {
    return this.documents.listByEpisode(user, episodeId, type);
  }

  @Put('documents')
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertDocumentDto) {
    return this.documents.upsert(user, dto);
  }

  @Get('episodes/:episodeId/epicrisis')
  latestEpicrisis(
    @CurrentUser() user: AuthUser,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
  ) {
    return this.documents.getLatest(user, episodeId, 'epicrisis');
  }

  @Post('episodes/:episodeId/epicrisis')
  generateEpicrisis(
    @CurrentUser() user: AuthUser,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
  ) {
    return this.epicrisis.generate(user, episodeId);
  }
}
