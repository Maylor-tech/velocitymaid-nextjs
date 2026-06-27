/**
 * Reusable Section Component
 * 
 * Provides consistent spacing and layout for page sections
 */

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

export default function Section({ children, className = "" }: SectionProps) {
  return (
    <section className={`py-20 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto max-w-6xl">
        {children}
      </div>
    </section>
  );
}


