// Stalwart DNS Record
type DNSRecordType = 'MX' | 'TXT' | 'SRV' | 'CNAME' | 'TLSA';

interface DNSRecord {
  type: DNSRecordType;
  name: string;
  content: string;
}

interface DNSResponse {
  data: DNSRecord[];
}

// Cloudflare Zone
interface CloudflareZone {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  type: string;
  development_mode: number;
  name_servers: string[];
  original_name_servers: string[];
  original_registrar: string | null;
  original_dnshost: string | null;
  modified_on: string; // ISO date string
  created_on: string; // ISO date string
  activated_on: string; // ISO date string
  vanity_name_servers: string[];
  vanity_name_servers_ips: string[] | null;
  meta: {
    step: number;
    custom_certificate_quota: number;
    page_rule_quota: number;
    phishing_detected: boolean;
  };
  owner: {
    id: string | null;
    type: string;
    email: string | null;
  };
  account: {
    id: string;
    name: string;
  };
  tenant: {
    id: string | null;
    name: string | null;
  };
  tenant_unit: {
    id: string | null;
  };
  permissions: string[];
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    frequency: string;
    is_subscribed: boolean;
    can_subscribe: boolean;
    legacy_id: string;
    legacy_discount: boolean;
    externally_managed: boolean;
  };
}

interface CloudflareZoneResponse {
  result: CloudflareZone[];
  result_info: {
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
    total_count: number;
  };
  success: boolean;
  errors: any[]; // can be typed further if known
  messages: any[]; // can be typed further if known
}

// Cloudflare TLSA DNS Record
interface TlsaData {
  certificate: string;
  matching_type: number; // 0, 1, 2
  selector: number; // 0, 1
  usage: number; // 0, 1, 2, 3
}
interface CloudflareTLSADNSRecord {
  id: string;
  name: string;
  type: 'TLSA'; // Literal type for TLSA records
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  data: TlsaData;
  settings: Record<string, any>; // Empty object {}
  meta: Record<string, any>; // Empty object {}
  comment: string | null;
  tags: string[];
  created_on: string; // ISO 8601 date string
  modified_on: string; // ISO 8601 date string
}
interface CloudflareTLSADNSRecordResponse {
  result: CloudflareTLSADNSRecord[];
  success: boolean;
  errors: any[]; // can be typed further if known
  messages: any[]; // can be typed further if known
}

export type {
  DNSRecord,
  DNSResponse,
  CloudflareZone,
  CloudflareZoneResponse,
  CloudflareTLSADNSRecord,
  CloudflareTLSADNSRecordResponse,
};
