import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Work With VelocityMaid Jamaica | Cleaner Jobs in Port Antonio',
  description: 'Competitive pay, flexible schedule, and professional training for local cleaners in Port Antonio, Jamaica. Join the VelocityMaid team today.',
  openGraph: {
    title: 'Work With VelocityMaid Jamaica | Cleaner Jobs',
    description: 'Competitive pay, flexible schedule, and professional training for local cleaners in Port Antonio, Jamaica.',
    url: 'https://velocitymaid.com/jamaica/work-with-us',
    siteName: 'VelocityMaid',
    type: 'website',
  },
};

export default function WorkWithUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EmploymentAgency",
    "name": "VelocityMaid Jamaica",
    "description": "Recruiting and training professional cleaners in Jamaica.",
    "url": "https://velocitymaid.com/jamaica/work-with-us",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Port Antonio",
      "addressRegion": "Portland",
      "addressCountry": "Jamaica"
    },
    "telephone": "+1-876-555-1985",
    "jobLocation": {
      "@type": "Place",
      "name": "Port Antonio, Jamaica"
    },
    "hiringOrganization": {
      "@type": "Organization",
      "name": "VelocityMaid"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}

