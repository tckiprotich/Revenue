// ServiceForm.tsx
import React, { useState, useEffect } from 'react';
import { formatCurrency } from './utils';
import {toast } from 'react-hot-toast'

interface ServiceFormProps {
  service: MunicipalService;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ service, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<any>({});
  const [calculatedCost, setCalculatedCost] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClassName = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const labelClassName = "block text-sm font-medium text-gray-700 mb-1";
  const groupClassName = "space-y-1";

  const calculateCost = () => {
    switch (service.service_code) {
      case 'PRK':
        if (!formData.duration || !formData.vehicleType) return;
        const parkingRates = service.billing_rules[formData.duration];
        setCalculatedCost(parkingRates[formData.vehicleType]);
        break;
  
      case 'WTR':
        if (!formData.usageType || !formData.reading) return;
        const waterRules = service.billing_rules[formData.usageType];
        const reading = parseInt(formData.reading);
        let cost = 0;
  
        if (formData.usageType === 'domestic') {
          if (reading <= 10) {
            cost = reading * waterRules['0-10'];
          } else if (reading <= 30) {
            cost = (10 * waterRules['0-10']) + ((reading - 10) * waterRules['11-30']);
          } else if (reading <= 60) {
            cost = (10 * waterRules['0-10']) + (20 * waterRules['11-30']) + 
                  ((reading - 30) * waterRules['31-60']);
          } else {
            cost = (10 * waterRules['0-10']) + (20 * waterRules['11-30']) + 
                  (30 * waterRules['31-60']) + ((reading - 60) * waterRules['above_60']);
          }
        } else { // commercial
          if (reading <= 50) {
            cost = reading * waterRules['0-50'];
          } else if (reading <= 100) {
            cost = (50 * waterRules['0-50']) + ((reading - 50) * waterRules['51-100']);
          } else {
            cost = (50 * waterRules['0-50']) + (50 * waterRules['51-100']) + 
                  ((reading - 100) * waterRules['above_100']);
          }
        }
        setCalculatedCost(cost);
        break;
  
      case 'BIZ':
        if (!formData.businessType) return;
        const bizRules = service.billing_rules[formData.businessType];
        setCalculatedCost(bizRules.base_fee + bizRules.processing_fee);
        break;
  
      case 'LND':
        if (!formData.propertyType || !formData.propertyValue) return;
        const landRules = service.billing_rules[formData.propertyType];
        const value = parseFloat(formData.propertyValue);
        const calculatedRate = value * landRules.rate_percentage;
        setCalculatedCost(Math.max(calculatedRate, landRules.minimum_charge));
        break;
  
      case 'WST':
        if (!formData.customerType || !formData.binSize) return;
        const wasteRules = service.billing_rules[formData.customerType];
        setCalculatedCost(wasteRules[formData.binSize]);
        break;
  
      default:
        setCalculatedCost(0);
        break;
    }
  };

  useEffect(() => {
    calculateCost();
  }, [formData]);

  const renderServiceForm = () => {
    switch (service.service_code) {
      case 'PRK':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={groupClassName}>
              <label className={labelClassName}>Vehicle Type</label>
              <select 
                className={inputClassName}
                onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                required
              >
                <option value="">Select vehicle type</option>
                <option value="car">Car</option>
                <option value="lorry">Lorry</option>
                <option value="motorcycle">Motorcycle</option>
              </select>
            </div>

            <div className={groupClassName}>
              <label className={labelClassName}>Duration</label>
              <select 
                className={inputClassName}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                required
              >
                <option value="">Select duration</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className={groupClassName}>
              <label className={labelClassName}>Vehicle Plate Number</label>
              <input 
                type="text"
                placeholder="e.g., KAA 123B"
                className={inputClassName}
                onChange={(e) => setFormData({...formData, plateNumber: e.target.value})}
                required
              />
            </div>

            <div className={groupClassName}>
              <label className={labelClassName}>Zone</label>
              <select 
                className={inputClassName}
                onChange={(e) => setFormData({...formData, zone: e.target.value})}
                required
              >
                <option value="">Select zone</option>
                {service.zones?.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'WTR':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={groupClassName}>
              <label className={labelClassName}>Usage Type</label>
              <select 
                className={inputClassName}
                onChange={(e) => setFormData({...formData, usageType: e.target.value})}
                required
              >
                <option value="">Select usage type</option>
                <option value="domestic">Domestic</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div className={groupClassName}>
              <label className={labelClassName}>Meter Reading (m³)</label>
              <input 
                type="number"
                min="0"
                placeholder="Enter meter reading"
                className={inputClassName}
                onChange={(e) => setFormData({...formData, reading: e.target.value})}
                required
              />
              {/* input for house number */}
              <label className={labelClassName}>House Number</label>
              <input 
                type="text"
                placeholder="Enter house number"
                className={inputClassName}
                onChange={(e) => setFormData({...formData, houseNumber: e.target.value})}
                required
              />
            </div>
          </div>
        );
        case 'LND':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={groupClassName}>
            <label className={labelClassName}>Property Type</label>
            <select 
              className={inputClassName}
              onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
              required
            >
              <option value="">Select property type</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>

          <div className={groupClassName}>
            <label className={labelClassName}>Property Value (KSH)</label>
            <input 
              type="number"
              min="0"
              placeholder="Enter property value"
              className={inputClassName}
              onChange={(e) => setFormData({...formData, propertyValue: e.target.value})}
              required
            />
          </div>
          {/* title deed */}
          <div className={groupClassName}>
            <label className={labelClassName}>Title Deed Number</label>
            <input 
              type="text"
              placeholder="Enter title deed number"
              className={inputClassName}
              onChange={(e) => setFormData({...formData, titleDeed: e.target.value})}
              required
            />
            </div>
          
          <div className="col-span-2">
            <p className="text-sm text-gray-600">
              Rate: {formData.propertyType ? 
                `${service.billing_rules[formData.propertyType].rate_percentage * 100}%` : '-%'} |
              Minimum Charge: {formData.propertyType ? 
                formatCurrency(service.billing_rules[formData.propertyType].minimum_charge) : '-'}
            </p>
          </div>
        </div>
      );

    case 'BIZ':
      return (
        <div className="grid grid-cols-1 gap-6">
          <div className={groupClassName}>
            <label className={labelClassName}>Business Type</label>
            <select 
              className={inputClassName}
              onChange={(e) => setFormData({...formData, businessType: e.target.value})}
              required
            >
              <option value="">Select business type</option>
              <option value="small_enterprise">Small Enterprise</option>
              <option value="medium_enterprise">Medium Enterprise</option>
              <option value="large_enterprise">Large Enterprise</option>
            </select>
          </div>

          {/* Bussines registration number */}
          <div className={groupClassName}>
            <label className={labelClassName}>Business Registration Number</label>
            <input 
              type="text"
              placeholder="Enter business registration number"
              className={inputClassName}
              onChange={(e) => setFormData({...formData, businessNumber: e.target.value})}
              required
            />
            </div>

          {formData.businessType && (
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">Fee: 
                {formatCurrency(service.billing_rules[formData.businessType].base_fee)}
              </p>
              <p className="text-sm text-gray-600">Processing Fee: 
                {formatCurrency(service.billing_rules[formData.businessType].processing_fee)}
              </p>
            </div>
          )}

          {/* <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Required Documents:</p>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {service.requirements?.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </div> */}
        </div>
      );

    case 'WST':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={groupClassName}>
            <label className={labelClassName}>Customer Type</label>
            <select 
              className={inputClassName}
              onChange={(e) => setFormData({...formData, customerType: e.target.value})}
              required
            >
              <option value="">Select customer type</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>

          <div className={groupClassName}>
            <label className={labelClassName}>Bin Size</label>
            <select 
              className={inputClassName}
              onChange={(e) => setFormData({...formData, binSize: e.target.value})}
              required
            >
              <option value="">Select bin size</option>
              <option value="small_bin">Small Bin</option>
              <option value="medium_bin">Medium Bin</option>
              <option value="large_bin">Large Bin</option>
            </select>
          </div>

          {/* bin serial number */}
          <div className={groupClassName}>
            <label className={labelClassName}>Bin Serial Number</label>
            <input 
              type="text"
              placeholder="Enter bin serial number"
              className={inputClassName}
              onChange={(e) => setFormData({...formData, binSerial: e.target.value})}
              required
            />
            </div>

          {formData.customerType && (
            <div className="col-span-2 bg-gray-50 p-4 rounded-md">
              <p className="text-sm font-medium text-gray-700">Monthly Rates:</p>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <p className="text-sm text-gray-600">Small Bin: 
                  {formatCurrency(service.billing_rules[formData.customerType].small_bin)}
                </p>
                <p className="text-sm text-gray-600">Medium Bin: 
                  {formatCurrency(service.billing_rules[formData.customerType].medium_bin)}
                </p>
                <p className="text-sm text-gray-600">Large Bin: 
                  {formatCurrency(service.billing_rules[formData.customerType].large_bin)}
                </p>
              </div>
            </div>
          )}
        </div>
      );

    default:
      return null;
  
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const paymentData = {
        ...formData,
        calculatedCost,
        serviceCode: service.service_code,
        serviceName: service.service_name,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment failed');
      }

      const result = await response.json();
      console.log('Payment processed:', result);

      // ServiceForms.tsx
if (result.success && result.data.url) {
  // Show loading toast
  toast.success('Redirecting to payment page...', {
    duration: 2000,
    position: 'top-center',
    icon: '🔄',
  });

  // Short delay to show toast
  setTimeout(() => {
    // Access correct URL path from response
    window.location.href = result.data.url;
  }, 1000);

} else {
  toast.error('Payment link not found', {
    duration: 3000,
    position: 'top-center',
    icon: '❌',
  });
  throw new Error('Payment URL not found in response');
}

      onSubmit(result);
    } catch (error: any) {
      toast.error(error.message || 'Payment failed', {
        duration: 5000,
        position: 'top-center',
        icon: '❌',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-xl max-w-3xl w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{service.service_name} Payment</h2>
        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
          {service.service_code}
        </span>
      </div>

      <form onSubmit={(e) => {handleSubmit(e)
      }}>
        {renderServiceForm()}
        
        <div className="mt-8 border-t pt-6">
          <div className="mb-6 text-right">
            <p className="text-sm text-gray-600">Calculated Amount</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculatedCost)}</p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || calculatedCost === 0}
            >
              {isSubmitting ? 'Processing...' : 'Proceed to Pay'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;