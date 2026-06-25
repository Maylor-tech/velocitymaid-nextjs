/**
 * Access Pending Notice
 * 
 * Confirmation message after access request is submitted
 * Calm, professional, sets clear expectations
 */

export default function AccessPendingNotice() {
  return (
    <div className="mt-8 rounded-md border border-vm-border bg-vm-surface p-6">
      <h4 className="font-medium text-vm-text">
        Access Request Received
      </h4>

      <p className="mt-2 max-w-2xl text-vm-muted">
        Thank you for your interest. Access requests are reviewed to ensure
        appropriate context and alignment.
      </p>

      <p className="mt-2 text-sm text-vm-muted">
        You'll receive a response by email shortly.
      </p>
    </div>
  );
}


