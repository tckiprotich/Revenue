// ServiceCard.tsx
import React, { useState, useEffect } from 'react';
import { formatCurrency } from './utils';

interface ServiceCardProps {
  service: MunicipalService;
  onSelect: (service: MunicipalService) => void;
}

interface ServiceDetails {
  lastCharge: number | null;
  lastReading: number | null;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelect }) => {
  const [details, setDetails] = useState<ServiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServiceDetails();
  }, [service.service_code]);

  const fetchServiceDetails = async () => {
    try {
      const response = await fetch(`/api/services/${service.service_code}/last-reading`);
      const data = await response.json();
      if (data.success) {
        setDetails(data.data);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to load service details');
    } finally {
      setIsLoading(false);
    }
  };

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
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{service.service_name}</h3>
          <p className="text-sm text-gray-600 mt-2">{service.description}</p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
          {service.service_code}
        </span>
      </div>
      
      {/* Service Details */}
      <div className="mt-4 space-y-2">
        <p className="text-sm text-gray-700">
          <span className="font-medium">Billing Period:</span>{' '}
          <span className="capitalize">{service.billing_period}</span>
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium">Rate:</span>{' '}
          <span>{getRatePreview()}</span>
        </p>
        
        {/* Previous Usage Details */}
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : details && (
          <div className="space-y-1">
            {details.lastCharge !== null && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Last Payment:</span>{' '}
                <span className="text-green-600 font-semibold">
                  {formatCurrency(details.lastCharge)}
                </span>
              </p>
            )}
            {service.service_code === 'WTR' && details.lastReading !== null && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Last Reading:</span>{' '}
                <span className="font-semibold">{details.lastReading} m³</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Additional Info */}
      {service.service_code === 'BIZ' && service.requirements && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-xs font-medium text-blue-800 mb-2">Required Documents:</p>
          <ul className="text-xs text-blue-700 list-disc list-inside">
            {service.requirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => onSelect(service)}
        className="mt-6 w-full bg-blue-600 text-white px-4 py-2.5 rounded-md
                 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 
                 transition-all duration-200 font-medium
                 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Loading...
          </span>
        ) : (
          'Pay Now'
        )}
      </button>
    </div>
  );
};

export default ServiceCard;