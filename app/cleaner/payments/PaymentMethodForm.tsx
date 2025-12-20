"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialMethodType?: string;
}

export default function PaymentMethodForm({
  onSuccess,
  onCancel,
  initialMethodType = "BANK",
}: PaymentMethodFormProps) {
  const [methodType, setMethodType] = useState(initialMethodType);
  const [details, setDetails] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Basic validation
      if (methodType === "BANK") {
        if (!details.bankName || !details.routingNumber || !details.accountNumber) {
          setError("Please fill in all bank details");
          setLoading(false);
          return;
        }
      } else if (methodType === "CASH") {
        // Cash doesn't need validation - ensure details is at least an empty object
        if (!details || Object.keys(details).length === 0) {
          setDetails({});
        }
      } else if (methodType === "ZELLE") {
        if (!details.handle && !details.email && !details.phone) {
          setError("Please enter your Zelle email or phone number");
          setLoading(false);
          return;
        }
      } else if (methodType === "VENMO") {
        if (!details.handle && !details.username && !details.phone) {
          setError("Please enter your Venmo username or phone number");
          setLoading(false);
          return;
        }
      } else if (methodType === "CASH_APP") {
        if (!details.handle) {
          setError("Please enter your Cash App handle");
          setLoading(false);
          return;
        }
      } else if (methodType === "PAYPAL") {
        if (!details.handle && !details.email) {
          setError("Please enter your PayPal email");
          setLoading(false);
          return;
        }
      }

      // Ensure details is always an object (required by backend)
      const payload = {
        methodType,
        details: methodType === "CASH" && (!details || Object.keys(details).length === 0) 
          ? {} 
          : details,
      };

      const res = await fetch("/api/cleaner/payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save payment method");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save payment method");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method Type
        </label>
        <select
          value={methodType}
          onChange={(e) => {
            setMethodType(e.target.value);
            setDetails({}); // Reset details when method type changes
            setError(null);
          }}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          disabled={loading}
        >
          <option value="BANK">Bank Transfer</option>
          <option value="ZELLE">Zelle</option>
          <option value="VENMO">Venmo</option>
          <option value="CASH_APP">Cash App</option>
          <option value="PAYPAL">PayPal</option>
          <option value="CASH">Cash</option>
        </select>
      </div>

      {methodType === "BANK" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name
            </label>
            <input
              type="text"
              placeholder="e.g., Chase, Bank of America"
              value={details.bankName || ""}
              onChange={(e) =>
                setDetails({ ...details, bankName: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Routing Number
            </label>
            <input
              type="text"
              placeholder="9-digit routing number"
              value={details.routingNumber || ""}
              onChange={(e) =>
                setDetails({ ...details, routingNumber: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              disabled={loading}
              maxLength={9}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number
            </label>
            <input
              type="text"
              placeholder="Account number"
              value={details.accountNumber || ""}
              onChange={(e) =>
                setDetails({ ...details, accountNumber: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>
        </>
      )}

      {methodType === "ZELLE" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zelle Email or Phone
          </label>
          <input
            type="text"
            placeholder="email@example.com or +1234567890"
            value={details.handle || details.email || details.phone || ""}
            onChange={(e) => {
              const value = e.target.value;
              // Store as handle, but also set email/phone if it looks like one
              if (value.includes("@")) {
                setDetails({ ...details, handle: value, email: value });
              } else if (value.startsWith("+") || /^\d/.test(value)) {
                setDetails({ ...details, handle: value, phone: value });
              } else {
                setDetails({ ...details, handle: value });
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            disabled={loading}
          />
        </div>
      )}

      {methodType === "CASH_APP" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cash App Handle
          </label>
          <input
            type="text"
            placeholder="$yourhandle"
            value={details.handle || ""}
            onChange={(e) => setDetails({ ...details, handle: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            disabled={loading}
          />
        </div>
      )}

      {methodType === "PAYPAL" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PayPal Email
          </label>
          <input
            type="email"
            placeholder="email@example.com"
            value={details.handle || details.email || ""}
            onChange={(e) => {
              const value = e.target.value;
              setDetails({ ...details, handle: value, email: value });
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            disabled={loading}
          />
        </div>
      )}

      {methodType === "VENMO" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Venmo Username or Phone
          </label>
          <input
            type="text"
            placeholder="@username or +1234567890"
            value={details.handle || details.username || details.phone || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value.startsWith("@")) {
                setDetails({ ...details, handle: value, username: value });
              } else if (value.startsWith("+") || /^\d/.test(value)) {
                setDetails({ ...details, handle: value, phone: value });
              } else {
                setDetails({ ...details, handle: value });
              }
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            disabled={loading}
          />
        </div>
      )}

      {methodType === "CASH" && (
        <div className="bg-muted border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            Cash payments don't require additional details. You'll receive cash
            payouts directly.
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Payment Method"
          )}
        </Button>
      </div>
    </form>
  );
}

