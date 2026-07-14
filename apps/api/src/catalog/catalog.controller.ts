import { Controller, Get, Inject, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import { DB } from '../db/db.module';
import type { Database } from '../db/client';
import { assessmentTypes, muscleGroups, romNorms, scalePoints } from '../db/schema';

/**
 * Read-only clinical reference data used by the assessment UI. Not tenant-scoped
 * (global catalog). Requires auth like everything else.
 */
@ApiTags('catalog')
@ApiBearerAuth()
@Controller('catalog')
export class CatalogController {
  constructor(@Inject(DB) private readonly db: Database) {}

  @Get('assessment-types')
  assessmentTypes() {
    return this.db.select().from(assessmentTypes).orderBy(assessmentTypes.code);
  }

  @Get('rom-norms')
  romNorms(@Query('region') region?: string) {
    return this.db
      .select()
      .from(romNorms)
      .where(region ? eq(romNorms.bodyRegion, region) : undefined)
      .orderBy(romNorms.bodyRegion, romNorms.motion);
  }

  @Get('muscle-groups')
  muscleGroups(@Query('region') region?: string) {
    return this.db
      .select()
      .from(muscleGroups)
      .where(region ? eq(muscleGroups.bodyRegion, region) : undefined)
      .orderBy(muscleGroups.bodyRegion, muscleGroups.code);
  }

  @Get('scales')
  scales(@Query('code') code?: string) {
    return this.db
      .select()
      .from(scalePoints)
      .where(code ? eq(scalePoints.scaleCode, code) : undefined)
      .orderBy(scalePoints.scaleCode, scalePoints.value);
  }
}
