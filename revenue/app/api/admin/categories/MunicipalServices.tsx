"use client";

import { useState } from "react";

interface Rate {
    [key: string]: number;
}

interface Service {
    service_name: string;
    description: string;
    rate: Rate;
    unit: string;
    billing_period: string;
}

interface MunicipalServicesProps {
    initialServices: Service[];
}

const MunicipalServices: React.FC<MunicipalServicesProps> = ({ initialServices }) => {
    const [services, setServices] = useState<Service[]>(initialServices);
    const [newService, setNewService] = useState<Service>({
        service_name: "",
        description: "",
        rate: {},
        unit: "",
        billing_period: "",
    });

    const [editingRate, setEditingRate] = useState<{ index: number; key: string; value: number } | null>(null);

    // Function to add a new service
    const addService = () => {
        if (newService.service_name && newService.description && Object.keys(newService.rate).length > 0) {
            setServices([...services, newService]);
            setNewService({
                service_name: "",
                description: "",
                rate: {},
                unit: "",
                billing_period: "",
            });
        } else {
            alert("Please fill in all fields, including at least one rate.");
        }
    };

    // Function to delete a service
    const deleteService = (index: number) => {
        setServices((prevServices) => prevServices.filter((_, i) => i !== index));
    };

    // Function to handle updating rate
    const updateRate = (index: number, key: string, value: number) => {
        const updatedServices = [...services];
        updatedServices[index].rate[key] = value;
        setServices(updatedServices);
        setEditingRate(null);
    };

    // UI Rendering
    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Municipal Services</h2>
            <table className="min-w-full bg-gray-100 border border-gray-300 rounded-lg overflow-hidden">
                <thead>
                    <tr className="bg-gray-200 text-gray-700">
                        <th className="px-4 py-2 border">Service Name</th>
                        <th className="px-4 py-2 border">Description</th>
                        <th className="px-4 py-2 border">Rates</th>
                        <th className="px-4 py-2 border">Unit</th>
                        <th className="px-4 py-2 border">Billing Period</th>
                        <th className="px-4 py-2 border">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map((service, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 font-semibold">{service.service_name}</td>
                            <td className="px-4 py-2">{service.description}</td>
                            <td className="px-4 py-2">
                                {Object.entries(service.rate).map(([key, value]) => (
                                    <div key={key} className="flex items-center mb-1">
                                        <span className="font-medium">{key}:</span>{" "}
                                        <input
                                            type="number"
                                            value={editingRate?.index === index && editingRate.key === key ? editingRate.value : value}
                                            onChange={(e) => setEditingRate({ index, key, value: parseFloat(e.target.value) })}
                                            onBlur={() => updateRate(index, key, editingRate?.value || 0)}
                                            className="border rounded p-1 mx-2 w-full"
                                        />
                                    </div>
                                ))}
                            </td>
                            <td className="px-4 py-2">{service.unit}</td>
                            <td className="px-4 py-2">{service.billing_period}</td>
                            <td className="px-4 py-2">
                                <button
                                    onClick={() => deleteService(index)}
                                    className="text-red-500 hover:text-red-700 transition"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h3 className="text-lg font-semibold mt-6 mb-2">Add New Service</h3>
            <div className="mb-4 flex flex-col space-y-2">
                <input
                    type="text"
                    placeholder="Service Name"
                    value={newService.service_name}
                    onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                    className="border rounded p-2"
                />
                <input
                    type="text"
                    placeholder="Description"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    className="border rounded p-2"
                />

                {Object.entries(newService.rate).map(([key, value]) => (
                    <input
                        key={key}
                        type="number"
                        placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)} Rate`}
                        value={value}
                        onChange={(e) =>
                            setNewService({
                                ...newService,
                                rate: { ...newService.rate, [key]: parseFloat(e.target.value) },
                            })
                        }
                        className="border rounded p-2"
                    />
                ))}

                <button
                    onClick={() => setNewService({ ...newService, rate: { ...newService.rate, [`rate_${Object.keys(newService.rate).length + 1}`]: 0 } })}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                >
                    Add Rate Field
                </button>

                <button
                    onClick={addService}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                    Add Service
                </button>
            </div>
        </div>
    );
};

export default MunicipalServices;
