"use client"
import { useState, useEffect } from 'react';
import { useAuth, RedirectToSignIn, useUser } from '@clerk/nextjs';
import { redirect } from 'next/dist/server/api-utils';
const IntaSend = require('intasend-node');
import { saveTransaction } from './savePay';

interface Rate {
  base_charge?: number;
  per_cubic_meter?: number;
  per_additional_bag?: number;
  percentage_of_property_value?: number;
  single_trip?: number;
  monthly_pass?: number;
  base_fee?: number;
  per_square_meter?: number;
  monthly_charge?: number;
  membership?: number;
  per_event_ticket?: number;
  resident_permit?: number;
  visitor_permit?: number;
  business_license?: number;
  pet_license?: number;
  alcohol_permit?: number;
}

interface Service {
  service_name: string;
  description: string;
  rate: Rate;
  unit: string;
  billing_period: string;
}

interface ServiceSelectionProps {
  services: Service[];
}

const ServiceSelection: React.FC<ServiceSelectionProps> = ({ services }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [selectedServices, setSelectedServices] = useState<{ service_name: string, rate: number }[]>([]);

  const handleSelectService = (service: Service) => {
    const rateValue = getFirstRateValue(service.rate);
    setSelectedServices((prev) =>
      prev.some((s) => s.service_name === service.service_name)
        ? prev.filter((s) => s.service_name !== service.service_name)
        : [...prev, { service_name: service.service_name, rate: rateValue }]
    );
  };

  const getFirstRateValue = (rate: Rate) => {
    const [firstValue] = Object.values(rate);
    return firstValue;
  };

  const calculateTotalAmount = () => {
    return selectedServices.reduce((total, service) => {
      return total + (typeof service.rate === 'number' ? service.rate : 0);
    }, 0);
  };

  const handlePayNow = async () => {
    if (!isLoaded || !user) {
      return <RedirectToSignIn />;
    }

    const totalAmount = calculateTotalAmount();
    const userId = user.id;
    const firstName = user.firstName;
    const lastName = user.lastName;
    const email = user.emailAddresses[0].emailAddress;

    console.log("Selected services for payment:", selectedServices);
    console.log("Total amount:", totalAmount);

    try {
      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          amount: totalAmount,
          services: selectedServices,
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("Payment response:", data);

      await saveTransaction({
        id: data.id,
        first_name: firstName,
        last_name: lastName,
        email,
        amount: totalAmount,
        purposeOfPay: selectedServices,
      });

      // Redirect to the payment URL
      window.location.href = data.url;

    } catch (error) {
      console.error("Error during payment process:", error);
      alert("An error occurred during the payment process. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <div key={`${service.service_name}-${index}`} className="p-6 border rounded-lg shadow-md transition-transform transform hover:scale-105">
            <h2 className="text-2xl font-bold mb-2">{service.service_name}</h2>
            <p className="text-gray-700 mb-4">{service.description}</p>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Rate:</h3>
              <p className="text-gray-600">{getFirstRateValue(service.rate)} {service.unit}</p>
            </div>
            <button
              className={`mt-2 px-4 py-2 rounded ${selectedServices.some((s) => s.service_name === service.service_name)
                ? 'bg-red-500 text-white'
                : 'bg-green-500 text-white'
                }`}
              onClick={() => handleSelectService(service)}
            >
              {selectedServices.some((s) => s.service_name === service.service_name) ? 'Deselect' : 'Select'}
            </button>
          </div>
        ))}
      </div>
      <div className="mt-8 p-6 border rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Selected Services:</h3>
        <ul className="list-disc list-inside space-y-2">
          {selectedServices.map((service, index) => (
            <li key={`${service.service_name}-${index}`} className="text-gray-700">
              <div className="flex justify-between items-center">
                <span>{service.service_name}</span>
                <span className="text-gray-600">{service.rate}</span>
              </div>
            </li>
          ))}
        </ul>
        {selectedServices.length > 0 && (
          <button
            className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
            onClick={handlePayNow}
          >
            Pay Now
          </button>
        )}
      </div>
    </div>
  );
};

export default ServiceSelection;