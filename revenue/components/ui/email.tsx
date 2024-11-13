import * as React from 'react';

interface EmailTemplateProps {
    firstName: string;
    email: string;
    services: any;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
    firstName,
    email,
    services,
}) => {
    console.log('EmailTemplate:', services);
    return (
        <div>
            <h1>Hello, {firstName}!</h1>
            <p>We have received your payment for the following services:</p>
            <ul>
                {services.map((serviceItem, index) => (
                    <li key={index}>
                        <strong>{serviceItem.service.service_name}</strong>: {serviceItem.service.description} - {serviceItem.charge} {serviceItem.service.unit}
                    </li>
                ))}
            </ul>
            <p>
                Thank you for your payment!
            </p>
        </div>
            
);

}

