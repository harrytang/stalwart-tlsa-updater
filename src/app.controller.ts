import { Controller, Get, Post, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { AppService } from './app.service';
import { UseGuards } from '@nestjs/common';
import { ApiGuard } from './api.guard';

@Controller()
export class AppController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly appService: AppService,
  ) {}

  @Get('healthz')
  getHealthz(): string {
    return this.appService.getHealthz();
  }

  @UseGuards(ApiGuard)
  @Post()
  async event() {
    // redis to store processing state to avoid duplicate processing
    // process only if no runningprocessing
    const isProcessing = await this.cacheManager.get('isProcessing');
    if (isProcessing) {
      console.info('Event is already being processed');
      return { message: 'Event is already being processed' };
    }

    console.info('Event is being processed');
    await this.cacheManager.set('isProcessing', true);

    const dnsRecords = await this.appService.getDNSRecords();
    const zone = await this.appService.getZone();
    const addedTLSARecords = await this.appService.addAllTLSARecords(
      zone.id,
      dnsRecords,
    );
    const deletedTLSARecords = await this.appService.deleteAllUnusedTLSARecords(
      zone.id,
      dnsRecords,
    );

    const res = {
      message: 'Event processed successfully',
      addedTLSARecords: addedTLSARecords,
      deletedTLSARecords: deletedTLSARecords,
    };

    console.info(res);

    await this.cacheManager.del('isProcessing');
    return res;
  }
}
