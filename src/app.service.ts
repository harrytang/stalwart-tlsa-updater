import { Injectable } from '@nestjs/common';
import {
  DNSResponse,
  CloudflareZoneResponse,
  CloudflareZone,
  DNSRecord,
  CloudflareTLSADNSRecord,
  CloudflareTLSADNSRecordResponse,
} from './types';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  getHealthz(): string {
    return 'OK';
  }

  async getDNSRecords(): Promise<DNSRecord[]> {
    const url = this.configService.getOrThrow<string>('STALWART_API_URL');
    const domain = this.configService.getOrThrow<string>('STALWART_DOMAIN');
    const apiKey = this.configService.getOrThrow<string>('STALWART_API_KEY');
    const { data } = await firstValueFrom(
      this.httpService.get<DNSResponse>(`${url}/dns/records/${domain}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }),
    );
    return data.data;
  }

  async getZone(): Promise<CloudflareZone> {
    const cloudflareUrl =
      this.configService.getOrThrow<string>('CLOUDFLARE_API_URL');
    const cloudflareApiKey =
      this.configService.getOrThrow<string>('CLOUDFLARE_API_KEY');
    const stalwartDomain =
      this.configService.getOrThrow<string>('STALWART_DOMAIN');
    const zone = await firstValueFrom(
      this.httpService.get<CloudflareZoneResponse>(`${cloudflareUrl}/zones`, {
        params: { name: stalwartDomain },
        headers: { Authorization: `Bearer ${cloudflareApiKey}` },
      }),
    );
    return zone.data.result[0];
  }

  async addAllTLSARecords(
    zoneId: string,
    records: DNSRecord[],
  ): Promise<DNSRecord[]> {
    const hostnames =
      this.configService.getOrThrow<string>('STALWART_HOSTNAMES').split(',') ??
      [];
    const addedRecords: DNSRecord[] = [];
    for (const hostname of hostnames) {
      const added = await this.addTLSARecords(zoneId, records, hostname);
      addedRecords.push(...added);
    }
    return addedRecords;
  }

  async deleteAllUnusedTLSARecords(
    zoneId: string,
    records: DNSRecord[],
  ): Promise<DNSRecord[]> {
    const deletedRecords: DNSRecord[] = [];
    const hostnames =
      this.configService.getOrThrow<string>('STALWART_HOSTNAMES').split(',') ??
      [];
    for (const hostname of hostnames) {
      const deleted = await this.deleteUnusedTLSARecords(
        zoneId,
        records,
        hostname,
      );
      deletedRecords.push(...deleted);
    }
    return deletedRecords;
  }

  async addTLSARecords(
    zoneId: string,
    records: DNSRecord[],
    hostname: string,
  ): Promise<DNSRecord[]> {
    const cloudflareUrl =
      this.configService.getOrThrow<string>('CLOUDFLARE_API_URL');
    const cloudflareApiKey =
      this.configService.getOrThrow<string>('CLOUDFLARE_API_KEY');

    const addedRecords: DNSRecord[] = [];
    const tlsaRecords = records.filter((record) =>
      record.type === 'TLSA' ? true : false,
    );

    const existingTLSARecords = await this.getCloudflareTLSARecords(
      zoneId,
      hostname,
    );

    for (const record of tlsaRecords) {
      const [usage, selector, matchingType, certificate] = record.content
        .trim()
        .split(/\s+/);

      const dnsData = {
        type: 'TLSA',
        name: `_25._tcp.${hostname}`,
        data: {
          usage,
          selector,
          matching_type: matchingType,
          certificate,
        },
        proxied: false,
      };

      // check if the TLSA record already exists to avoid duplicates
      if (
        existingTLSARecords.find(
          (existingRecord) =>
            existingRecord.content === record.content &&
            existingRecord.name === `_25._tcp.${hostname}`,
        )
      ) {
        continue;
      }
      await firstValueFrom(
        this.httpService.post(
          `${cloudflareUrl}/zones/${zoneId}/dns_records`,
          dnsData,
          {
            headers: { Authorization: `Bearer ${cloudflareApiKey}` },
          },
        ),
      );
      addedRecords.push({
        name: dnsData.name,
        type: 'TLSA',
        content: record.content,
      });
    }
    return addedRecords;
  }

  async deleteUnusedTLSARecords(
    zoneId: string,
    records: DNSRecord[],
    hostname: string,
  ): Promise<DNSRecord[]> {
    const cloudflareUrl =
      this.configService.getOrThrow<string>('CLOUDFLARE_API_URL');
    const cloudflareApiKey =
      this.configService.getOrThrow<string>('CLOUDFLARE_API_KEY');

    const existingTLSARecords = await this.getCloudflareTLSARecords(
      zoneId,
      hostname,
    );
    const deletedRecords: DNSRecord[] = [];

    for (const existingRecord of existingTLSARecords) {
      if (
        !records.map((r) => r.content).includes(existingRecord.content) ||
        existingRecord.name !== `_25._tcp.${hostname}`
      ) {
        await firstValueFrom(
          this.httpService.delete(
            `${cloudflareUrl}/zones/${zoneId}/dns_records/${existingRecord.id}`,
            {
              headers: { Authorization: `Bearer ${cloudflareApiKey}` },
            },
          ),
        );
        deletedRecords.push({
          name: existingRecord.name,
          type: existingRecord.type,
          content: existingRecord.content,
        });
      }
    }

    return deletedRecords;
  }

  async getCloudflareTLSARecords(
    zoneId: string,
    hostname: string,
  ): Promise<CloudflareTLSADNSRecord[]> {
    const cloudflareUrl =
      this.configService.getOrThrow<string>('CLOUDFLARE_API_URL');
    const cloudflareApiKey =
      this.configService.getOrThrow<string>('CLOUDFLARE_API_KEY');
    const response = await firstValueFrom(
      this.httpService.get<CloudflareTLSADNSRecordResponse>(
        `${cloudflareUrl}/zones/${zoneId}/dns_records?type=TLSA&name=_25._tcp.${hostname}`,
        {
          headers: { Authorization: `Bearer ${cloudflareApiKey}` },
        },
      ),
    );
    return response.data.result;
  }
}
