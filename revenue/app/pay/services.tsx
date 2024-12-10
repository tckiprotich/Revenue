// pages/revenue/index.tsx
import { useState } from 'react';
import { 
  Card, 
  Grid, 
  Select, 
  Button, 
  Text,
  Stack,
  Group,
  NumberInput 
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

export default function RevenuePage() {
  const [selectedService, setSelectedService] = useState('');
  const [serviceDetails, setServiceDetails] = useState(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ['municipal-services'],
    queryFn: () => fetch('/api/services').then(res => res.json())
  });

  const renderServiceForm = () => {
    if (!serviceDetails) return null;

    switch(serviceDetails.service_type) {
      case 'metered':
        return <MeteredServiceForm service={serviceDetails} />;
      case 'time_based':
        return <ParkingServiceForm service={serviceDetails} />;
      case 'annual_permit':
        return <PermitServiceForm service={serviceDetails} />;
      case 'property_based':
        return <PropertyRatesForm service={serviceDetails} />;
      default:
        return <BasicServiceForm service={serviceDetails} />;
    }
  };

  return (
    <Stack spacing="xl" p="md">
      <Text size="xl" weight={700}>Municipal Revenue Services</Text>
      
      <Select
        label="Select Service"
        placeholder="Choose a service"
        data={services?.map(s => ({ 
          value: s.service_code, 
          label: s.service_name 
        })) || []}
        onChange={(val) => {
          setSelectedService(val);
          setServiceDetails(services?.find(s => s.service_code === val));
        }}
      />

      {renderServiceForm()}
    </Stack>
  );
}