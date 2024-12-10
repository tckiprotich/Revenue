// types.ts
interface BillingRule {
    [key: string]: number | { [key: string]: number };
  }
  
  interface MunicipalService {
    service_name: string;
    service_code: string;
    description: string;
    service_type: string;
    billing_rules: {
      [key: string]: BillingRule;
    };
    unit: string;
    billing_period: string;
    connection_fee?: number;
    requirements?: string[];
    penalties?: {
      late_payment: number;
      default_charge: number;
    };
    zones?: string[];
  }