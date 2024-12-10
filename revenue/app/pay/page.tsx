// page.tsx
"use client"
import React, { useState } from 'react';
import ServiceCard from './ServiceCards';
import ServiceForm from './ServiceForms';
import servicesData from './data.json';

export default function ServicesPage() {
  const [selectedService, setSelectedService] = useState<MunicipalService | null>(null);

  const handlePaymentSubmit = (formData: any) => {
    console.log('Payment data:', formData);
    // Handle payment processing
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Municipal Services Payment Portal
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesData.municipal_services.map((service, index) => (
            <ServiceCard
              key={`${service.service_code}-${index}`}
              service={service}
              onSelect={setSelectedService}
            />
          ))}
        </div>

        {selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <ServiceForm
              service={selectedService}
              onSubmit={handlePaymentSubmit}
              onCancel={() => setSelectedService(null)}
            />
          </div>
        )}
      </div>
    </main>
  );
}