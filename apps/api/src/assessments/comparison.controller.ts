import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { ComparisonService } from './comparison.service';

@ApiTags('comparison')
@ApiBearerAuth()
@Controller('episodes/:episodeId/comparison')
export class ComparisonController {
  constructor(private readonly comparison: ComparisonService) {}

  @Get()
  @ApiQuery({ name: 'type', required: true, example: 'ROM' })
  @ApiQuery({ name: 'region', required: false, example: 'shoulder' })
  compare(
    @CurrentUser() user: AuthUser,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Query('type') type: string,
    @Query('region') region?: string,
  ) {
    return this.comparison.compare(user, episodeId, type, region);
  }
}
