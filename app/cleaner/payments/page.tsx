"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddPaymentMethodModal from "./AddPaymentMethodModal";
import { maskKeepLast } from "@/lib/mask";

type PaymentMethod = {
  id: string;
  methodType: string;
  details: any;
  isActive: boolean;
  verifiedAt: string | null;
  verifiedBy: string | null;
  verificationNote: string | null;
};

export default function CleanerPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadPaymentMethod = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cleaner/payment-method");
      if (!res.ok) throw new Error("Failed to load payment method");
      const data = await res.json();
      setMethod(data.method ?? null);
    } catch (err) {
      console.error(err);
      setMethod(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethod();
  }, []);

  const handleSuccess = () => {
    loadPaymentMethod();
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

          {!loading && !method && (
            <div className="border rounded-lg p-4 bg-muted space-y-2">
              <p className="font-medium">No payment method on file</p>
              <p className="text-sm text-muted-foreground">
                Add a payment method to receive payouts.
              </p>
              <Button onClick={() => setModalOpen(true)}>Add Payment Method</Button>
            </div>
          )}

          {!loading && method && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium capitalize">
                  {method.methodType.toLowerCase()} payout
                </p>

                {method.verifiedAt && method.isActive ? (
                  <Badge variant="success">Verified</Badge>
                ) : !method.isActive && method.verificationNote ? (
                  <Badge variant="destructive">Rejected</Badge>
                ) : (
                  <Badge variant="secondary">Pending verification</Badge>
                )}
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                {method.methodType === "BANK" ? (
                  <>
                    <div>
                      <span className="text-sm font-medium">Bank Name: </span>
                      <span className="text-sm">{method.details.bankName || "—"}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Routing Number: </span>
                      <span className="text-sm font-mono">
                        {maskKeepLast(method.details.routingNumber || "", 4)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Account Number: </span>
                      <span className="text-sm font-mono">
                        {maskKeepLast(method.details.accountNumber || "", 4)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div>
                    <span className="text-sm font-medium">
                      {method.methodType === "ZELLE"
                        ? "Zelle Email/Phone: "
                        : method.methodType === "CASH_APP"
                        ? "Cash App Handle: "
                        : method.methodType === "PAYPAL"
                        ? "PayPal Email: "
                        : method.methodType === "VENMO"
                        ? "Venmo Username: "
                        : "Handle: "}
                    </span>
                    <span className="text-sm font-mono">
                      {maskKeepLast(
                        method.details.handle ||
                          method.details.email ||
                          method.details.phone ||
                          "",
                        4
                      )}
                    </span>
                  </div>
                )}
              </div>

              {!method.verifiedAt && method.isActive && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    Your payment method is pending verification. You'll be able to
                    receive payouts once an administrator verifies your information.
                  </p>
                </div>
              )}

              {!method.isActive && method.verificationNote && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800">Payment Method Rejected</p>
                  <p className="text-sm text-red-700 mt-1">
                    {method.verificationNote}
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    Please update your payment method to receive payouts.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => setModalOpen(true)}
              >
                Update Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AddPaymentMethodModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
        isUpdate={!!method}
        initialMethodType={method?.methodType}
      />
    </div>
  );
}
