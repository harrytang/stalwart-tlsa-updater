import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { UseGuards } from '@nestjs/common';
import { ApiGuard } from './api.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('healthz')
  getHealthz(): string {
    return this.appService.getHealthz();
  }

  @UseGuards(ApiGuard)
  @Post()
  async event() {
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
      dnsRecords: dnsRecords,
      addedTLSARecords: addedTLSARecords,
      deletedTLSARecords: deletedTLSARecords,
    };

    console.info(res);

    return res;
  }
}
