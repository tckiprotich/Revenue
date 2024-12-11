// email.tsx
import * as React from 'react';

interface ServiceData {
  usageType: string;
  reading?: string;
  calculatedCost: number;
  serviceCode: string;
  serviceName: string;
  timestamp: string;
  details?: {
    // Water
    houseNumber?: string;
    // Business
    businessType?: string;
    businessNumber?: string;
    // Land
    titleDeed?: string;
    propertyType?: string;
    // Waste
    binSerial?: string;
    binSize?: string;
  };
}

interface EmailTemplateProps {
  firstName: string;
  email: string;
  services: ServiceData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES'
  }).format(amount);
};

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  email,
  services,
}) => (
  <div style={{
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
  }}>
    <div style={{
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px',
    }}>
      <h1 style={{ color: '#1a73e8', marginBottom: '20px' }}>
        Payment Confirmation
      </h1>
      <p>Hello {firstName},</p>
      <p>Thank you for your payment. Here are your transaction details:</p>
    </div>

    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <h2 style={{ color: '#202124', marginBottom: '15px' }}>Service Details</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tr>
          <td style={{ padding: '8px 0', color: '#5f6368' }}>Service:</td>
          <td style={{ padding: '8px 0', fontWeight: 'bold' }}>{services.serviceName}</td>
        </tr>

        {/* Water Service Details */}
        {services.serviceCode === 'WTR' && (
          <>
            <tr>
              <td style={{ padding: '8px 0', color: '#5f6368' }}>House Number:</td>
              <td style={{ padding: '8px 0' }}>{services.details?.houseNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#5f6368' }}>Meter Reading:</td>
              <td style={{ padding: '8px 0' }}>{services.reading} m³</td>
            </tr>
          </>
        )}

        {/* Business Permit Details */}
        {services.serviceCode === 'BIZ' && (
          <>
            <tr>
              <td style={{ padding: '8px 0', color: '#5f6368' }}>Business Number:</td>
              <td style={{ padding: '8px 0' }}>{services.details?.businessNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#5f6368' }}>Business Type:</td>
              <td style={{ padding: '8px 0', textTransform: 'capitalize' }}>
                {services.details?.businessType?.replace('_', ' ')}
              </td>
            </tr>
          </>
        )}

        {/* Land Rate Details */}
        {services.serviceCode === 'LND' && (
          <>
            <tr>
              <td style={{ padding: '8px 0', color: '#5f6368' }}>Title Deed:</td>
              <td style={{ padding: '8px 0' }}>{services.details?.titleDeed}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#5f6368' }}>Property Type:</td>
              <td style={{ padding: '8px 0', textTransform: 'capitalize' }}>
                {services.details?.propertyType}
              </td>
            </tr>
          </>
        )}

        {/* Waste Management Details */}
        {services.serviceCode === 'WST' && (
          <>
            <tr>
              <td style={{ padding: '8px 0', color: '#5f6368' }}>Bin Serial:</td>
              <td style={{ padding: '8px 0' }}>{services.details?.binSerial}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: '#5f6368' }}>Bin Size:</td>
              <td style={{ padding: '8px 0', textTransform: 'capitalize' }}>
                {services.details?.binSize?.replace('_', ' ')}
              </td>
            </tr>
          </>
        )}

        <tr>
          <td style={{ padding: '8px 0', color: '#5f6368' }}>Type:</td>
          <td style={{ padding: '8px 0', textTransform: 'capitalize' }}>{services.usageType}</td>
        </tr>
        <tr>
          <td style={{ padding: '8px 0', color: '#5f6368' }}>Amount:</td>
          <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#1a73e8' }}>
            {formatCurrency(services.calculatedCost)}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '8px 0', color: '#5f6368' }}>Date:</td>
          <td style={{ padding: '8px 0' }}>
            {new Date(services.timestamp).toLocaleString('en-KE')}
          </td>
        </tr>
      </table>
    </div>

    <div style={{ color: '#5f6368', fontSize: '14px', textAlign: 'center' as const }}>
      <p>If you have any questions, please contact our support team.</p>
      <p>Thank you for choosing our services!</p>
    </div>
  </div>
);