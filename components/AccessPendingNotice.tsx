/**
 * Access Pending Notice
 * 
 * Confirmation message after access request is submitted
 * Calm, professional, sets clear expectations
 */

export default function AccessPendingNotice() {
  return (
    <div className="mt-10 rounded-md border border-gray-200 bg-gray-50 p-6">
      <h4 className="font-medium text-gray-900">
        Access Request Received
      </h4>

      <p className="mt-2 max-w-2xl text-gray-600">
        Thank you for your interest. Access requests are reviewed to ensure
        appropriate context and alignment.
      </p>

      <p className="mt-2 text-sm text-gray-500">
        You'll receive a response by email shortly.
      </p>
    </div>
  );
}


