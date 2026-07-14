import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { AssessmentsService } from './assessments.service';
import { CreateAssessmentBulkDto, CreateAssessmentDto } from './dto/assessment.dto';

@ApiTags('assessments')
@ApiBearerAuth()
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  @Post()
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateAssessmentDto) {
    const { encounterId, ...item } = dto;
    const [row] = await this.assessments.createBulk(user, { encounterId, items: [item] });
    return row;
  }

  @Post('bulk')
  createBulk(@CurrentUser() user: AuthUser, @Body() dto: CreateAssessmentBulkDto) {
    return this.assessments.createBulk(user, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('encounterId') encounterId?: string,
    @Query('episodeId') episodeId?: string,
  ) {
    if (encounterId) return this.assessments.listByEncounter(user, encounterId);
    if (episodeId) return this.assessments.listByEpisode(user, episodeId);
    throw new BadRequestException('Provide either encounterId or episodeId');
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.assessments.softDelete(user, id);
  }
}
