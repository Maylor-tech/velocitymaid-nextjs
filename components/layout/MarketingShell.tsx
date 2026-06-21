import SiteHeader from "./SiteHeader";
import Footer from "@/components/Footer";

interface MarketingShellProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

/** Shared marketing layout: header + surface page + footer */
export default function MarketingShell({
  children,
  showFooter = true,
}: MarketingShellProps) {
  return (
    <div className="min-h-screen bg-vm-surface flex flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      {showFooter && <Footer />}
    </div>
  );
}
