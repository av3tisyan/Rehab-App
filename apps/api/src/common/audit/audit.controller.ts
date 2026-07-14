import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../current-user.decorator';
import { Roles } from '../roles.decorator';
import type { AuthUser } from '../auth-user';
import { AuditService } from './audit.service';

/**
 * Admin-only audit trail access. The @Roles('admin') guard blocks clinicians;
 * the underlying log itself is append-only and hash-chained at the DB level.
 */
@ApiTags('audit')
@ApiBearerAuth()
@Roles('admin')
@Controller('audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('entity') entity?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.audit.list(user, {
      entity,
      entityId,
      action,
      userId,
      from,
      to,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('verify')
  verify() {
    return this.audit.verifyChain();
  }
}
