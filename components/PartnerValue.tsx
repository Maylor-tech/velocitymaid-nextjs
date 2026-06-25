/**
 * Partner Value Proposition
 * 
 * Four key value propositions in a clean grid layout
 * Calm, operational, low-risk messaging
 */

export default function PartnerValue() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h3 className="text-lg font-medium text-vm-text">
          Low-Disruption Adoption
        </h3>
        <p className="mt-2 text-vm-muted">
          VelocityMaid runs alongside your current payroll and contractor workflows.
          Nothing is replaced on day one.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-vm-text">
          Clear Compliance Visibility
        </h3>
        <p className="mt-2 text-vm-muted">
          See exactly what documentation is complete, missing, or blocked—without
          chasing people manually.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-vm-text">
          Audit-Ready Records
        </h3>
        <p className="mt-2 text-vm-muted">
          Maintain timestamped, defensible records designed to support internal
          review or external audits.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-vm-text">
          Deliberate Scaling
        </h3>
        <p className="mt-2 text-vm-muted">
          Start with compliance infrastructure. Layer in payments and automation
          only when governance is ready.
        </p>
      </div>
    </div>
  );
}


