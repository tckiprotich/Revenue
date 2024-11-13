"use client";
import React, { useState } from 'react';
import data from './data.json';
import { useAuth, RedirectToSignIn, useUser } from '@clerk/nextjs';
import { redirect } from 'next/dist/server/api-utils';
const IntaSend = require('intasend-node');
import { saveTransaction } from './savePay';

const ServicesPage = () => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const { isLoaded, isSignedIn, user } = useUser();

  const handleSelectService = (service, charge) => {
    setSelectedServices((prev) => [...prev, { service, charge }]);
    setTotalAmount((prev) => prev + charge);
  };

  const handleRemoveService = (index, charge) => {
    setSelectedServices((prev) => prev.filter((_, i) => i !== index));
    setTotalAmount((prev) => prev - charge);
  };

  const handlePayNow = async () => {
    if (!isLoaded || !user) {
      return <RedirectToSignIn />;
    }

    const totalAmount = selectedServices.reduce((acc, item) => acc + item.charge, 0);
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
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Municipal Services</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.municipal_services.map((service, index) => (
          <ServiceCard
            key={index}
            service={service}
            onSelectService={handleSelectService}
          />
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Selected Services</h2>
        {selectedServices.length === 0 ? (
          <p>No services selected yet.</p>
        ) : (
          <div>
            <ul className="space-y-4">
              {selectedServices.map((item, idx) => (
                <li key={idx} className="flex justify-between items-center bg-white shadow p-4 rounded-lg">
                  <div className="text-lg font-medium text-gray-800">{item.service.service_name}</div>
                  <div>{item.charge.toFixed(2)} {item.service.unit}</div>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveService(idx, item.charge)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-lg font-semibold text-blue-600">
              Total Amount: {totalAmount.toFixed(2)} {selectedServices[0]?.service.unit}
            </div>

            {/* Payment Button */}
            <button 
            onClick={handlePayNow}
            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none">
              Pay Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ServiceCard = ({ service, onSelectService }) => {
  const { service_name, description, rate, unit, billing_period, input_required, options } = service;
  const [inputValue, setInputValue] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [total, setTotal] = useState(0);
  const [serviceUnit, setServiceUnit] = useState(unit || 'ksh');

  const calculateTotal = (input, selectedOpts = selectedOptions) => {
    let calculatedTotal = 0;
    let currentUnit = serviceUnit;

    // Handling Stormwater Service: Directly set the monthly charge as the total
    if (service_name === 'Stormwater Management' && rate.monthly_charge) {
      calculatedTotal = rate.monthly_charge;  // Directly set the monthly charge as total
      currentUnit = unit || 'ksh';
    }

    // Handling services with base charge and per-unit rate
    if (input_required) {
      if (input_required.field === 'cubic_meters' && rate.per_cubic_meter) {
        calculatedTotal = rate.base_charge + (input * rate.per_cubic_meter);
      } else if (input_required.field === 'additional_bags' && rate.per_additional_bag) {
        calculatedTotal = rate.base_charge + (input * rate.per_additional_bag);
      } else if (input_required.field === 'square_meters' && rate.per_square_meter) {
        calculatedTotal = rate.base_fee + (input * rate.per_square_meter);
      } else if (input_required.field === 'event_tickets' && rate.per_event_ticket) {
        calculatedTotal = rate.membership + (input * rate.per_event_ticket);
      }
    }

    // Handle Parking Calculation Based on Vehicle Type and Parking Type
    if (service_name === 'Parking' && options && options.length > 0) {
      let selectedParkingRate = 0;
      options.forEach(option => {
        const choice = selectedOpts[option.label];
        if (choice) {
          if (rate[choice]) {
            const selectedRate = rate[choice];
            if (typeof selectedRate === 'object') {
              selectedParkingRate = selectedRate[selectedOpts["Vehicle Type"]] || 0;
            } else {
              selectedParkingRate = selectedRate;
            }
            currentUnit = unit || 'ksh'; 
          }
        }
      });
      calculatedTotal += selectedParkingRate;
    }

    // Handle Licenses and Permits Calculation
    if (service_name === 'Licenses and Permits' && selectedOpts["License Type"]) {
      const licenseType = selectedOpts["License Type"];
      const selectedRate = rate[licenseType] || 0;
      calculatedTotal = selectedRate;
      currentUnit = unit || 'ksh'; 
    }

    setTotal(calculatedTotal);
    setServiceUnit(currentUnit); 
  };

  const handleInputChange = (event) => {
    const value = parseFloat(event.target.value) || 0;
    setInputValue(value);
    calculateTotal(value);
  };

  const handleOptionChange = (optionLabel, choice) => {
    setSelectedOptions(prev => ({ ...prev, [optionLabel]: choice }));
    calculateTotal(inputValue, { ...selectedOptions, [optionLabel]: choice });
  };

  const handlePayClick = () => {
    onSelectService(service, total);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
      <h2 className="text-xl font-semibold text-gray-700 mb-2">{service_name}</h2>
      <p className="text-gray-500 mb-4">{description}</p>

      {/* Rate Information */}
      <div className="text-sm text-gray-800 mb-4">
        {Object.entries(rate).map(([key, value]) => (
          <div key={key}>
            <span className="font-medium">{formatLabel(key)}:</span> {formatRate(value, unit)}
          </div>
        ))}
      </div>

      {/* Billing Period */}
      <div className="text-sm font-medium text-gray-600 mb-2">Billing Period: {billing_period}</div>

      {/* Input Field */}
      {input_required && (
        <div className="mt-4">
          <label className="text-sm text-gray-600 block mb-1" htmlFor={input_required.field}>
            {input_required.label}:
          </label>
          <input
            type="number"
            id={input_required.field}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Enter amount"
            value={inputValue}
            onChange={handleInputChange}
            required
          />
        </div>
      )}

      {/* Options (Dropdowns) */}
      {options && options.map((option, idx) => (
        <div className="mt-4" key={idx}>
          <label className="text-sm text-gray-600 block mb-1">{option.label}:</label>
          <select
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) => handleOptionChange(option.label, e.target.value)}
            required
          >
            <option value="">Select {option.label}</option>
            {option.choices.map(choice => (
              <option key={choice} value={choice}>{formatLabel(choice)}</option>
            ))}
          </select>
        </div>
      ))}

      {/* Display Calculated Total */}
      <div className="text-lg font-semibold text-blue-600 mt-4">
        Total Cost: {total.toFixed(2)} {serviceUnit}
      </div>

      {/* Pay Button */}
      <button
        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none"
        onClick={handlePayClick}
      >
        Select service
      </button>
    </div>
  );
};

// Helper functions for formatting labels and rates
const formatLabel = (label) => {
  return label.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
};

const formatRate = (rate, unit) => {
  if (typeof rate === 'object') {
    return Object.entries(rate).map(([key, value]) => `${formatLabel(key)}: ${value} ${unit}`).join(', ');
  }
  return `${rate} ${unit}`;
};

export default ServicesPage;
