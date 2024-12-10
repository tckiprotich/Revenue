// ServiceCard.tsx
import React from 'react';
import { formatCurrency } from './utils';

interface ServiceCardProps {
  service: MunicipalService;
  onSelect: (service: MunicipalService) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect }) => {
  const getRatePreview = () => {
    switch (service.service_code) {
      case 'PRK':
        return `From ${formatCurrency(service.billing_rules.hourly.car)} /hour`;
      case 'WTR':
        return `From ${formatCurrency(service.billing_rules.domestic['0-10'])} /unit`;
      case 'WST':
        return `From ${formatCurrency(service.billing_rules.residential.small_bin)} /month`;
      case 'BIZ':
        return `From ${formatCurrency(service.billing_rules.small_enterprise.base_fee)} /year`;
      case 'LND':
        return `From ${service.billing_rules.residential.rate_percentage * 100}% of value`;
      default:
        return '';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{service.service_name}</h3>
          <p className="text-sm text-gray-600 mt-2">{service.description}</p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
          {service.service_code}
        </span>
      </div>
      
      <div className="mt-4 space-y-2">
        <p className="text-sm text-gray-700">
          Billing Period: <span className="font-semibold capitalize">{service.billing_period}</span>
        </p>
        <p className="text-sm text-gray-700">
          Rate: <span className="font-semibold">{getRatePreview()}</span>
        </p>
      </div>

      <button
        onClick={() => onSelect(service)}
        className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Pay Now
      </button>
    </div>
  );
};



export default ServiceCard;