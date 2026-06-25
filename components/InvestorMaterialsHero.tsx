/**
 * Investor Materials Hero Section
 * 
 * Institutional hero section for gated investor materials
 * Signals seriousness, not a public download page
 */

export default function InvestorMaterialsHero() {
  return (
    <div className="border-b border-vm-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <h1 className="text-3xl font-semibold tracking-tight text-vm-text">
          Investor Materials
        </h1>

        <p className="mt-4 max-w-2xl text-lg text-vm-text">
          Confidential materials for qualified investors.
        </p>

        <p className="mt-6 max-w-3xl text-vm-muted">
          VelocityMaid shares detailed materials selectively to ensure context,
          alignment, and responsible use of information.
        </p>
      </div>
    </div>
  );
}


