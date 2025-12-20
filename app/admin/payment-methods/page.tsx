"use client";

import { useEffect, useState } from "react";
import { maskKeepLast } from "@/lib/mask";

type Pending = {
  id: string;
  cleanerId: string;
  methodType: string;
  details: any;
  createdAt: string;
};

export default function AdminPaymentMethodsPage() {
  const [items, setItems] = useState<Pending[]>([]);
  const [note, setNote] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminIdInput, setAdminIdInput] = useState<string>("");

  // Get admin ID from localStorage or cookie (for client-side)
  const getAdminId = () => {
    if (typeof window === "undefined") return "";
    // Try localStorage first
    const fromStorage = localStorage.getItem("adminId");
    if (fromStorage) return fromStorage;
    
    // Try to get from cookie
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "adminId" || name === "adminSession") {
        return value;
      }
    }
    return "";
  };

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const adminId = getAdminId();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      // Add admin ID header if available (for testing/development)
      if (adminId) {
        headers["x-admin-id"] = adminId;
      }

      const res = await fetch("/api/admin/payment-methods/pending", {
        headers: {
          "X-Admin-Id": adminId,
        },
      });
      
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load pending methods");
      }
      
      setItems(json?.pending || []);
    } catch (err: any) {
      console.error("Failed to load pending methods:", err);
      setError(err.message || "Failed to load pending payment methods");
    } finally {
      setLoading(false);
    }
  }

  async function verify(id: string, action: "approve" | "reject") {
    if (action === "reject" && !confirm("Are you sure you want to reject this payment method?")) {
      return;
    }

    try {
      const adminId = getAdminId();
      if (!adminId) {
        alert("Admin ID not set. Please set it first.");
        return;
      }

      const res = await fetch(`/api/admin/payment-methods/${id}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Id": adminId,
        },
        body: JSON.stringify({ 
          action,
          note: note[id] || (action === "reject" ? "Rejected by admin" : null),
        }),
      });

      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to ${action}`);
      }
      
      // Clear note for this item
      setNote((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      
      await load();
    } catch (err: any) {
      console.error(`Failed to ${action}:`, err);
      alert(err.message || `Failed to ${action} payment method`);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const currentAdminId = getAdminId();
  const needsAuth = !currentAdminId && error?.includes("Unauthorized");

  return (
    <div style={{ maxWidth: 980, margin: "40px auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Payment Method Verification</h1>
      <p style={{ opacity: 0.7 }}>Approve or reject cleaner payout methods.</p>

      {needsAuth && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: 8,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>
            Admin Authentication Required
          </div>
          <div style={{ fontSize: 14, marginBottom: 12, opacity: 0.8 }}>
            Enter your admin user ID to continue. You can find this in your database:
            <code style={{ display: "block", marginTop: 4, padding: 4, background: "#fff", borderRadius: 4 }}>
              SELECT id, email FROM "User" WHERE role = 'ADMIN' LIMIT 1;
            </code>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Enter Admin User ID"
              value={adminIdInput}
              onChange={(e) => setAdminIdInput(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: 14,
              }}
            />
            <button
              onClick={() => {
                if (adminIdInput.trim()) {
                  localStorage.setItem("adminId", adminIdInput.trim());
                  setError(null);
                  load();
                }
              }}
              style={{
                padding: "8px 16px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Set Admin ID
            </button>
          </div>
        </div>
      )}

      {error && !needsAuth && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "#fee",
            border: "1px solid #fcc",
            borderRadius: 8,
            color: "#c00",
          }}
        >
          {error}
        </div>
      )}

      {loading ? <p>Loading…</p> : null}
      {!loading && items.length === 0 ? (
        <div
          style={{
            marginTop: 24,
            padding: 18,
            border: "1px solid #eee",
            borderRadius: 12,
          }}
        >
          No pending payment methods.
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
        {items.map((pm) => {
          const d = pm.details || {};
          return (
            <div
              key={pm.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>{pm.methodType}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Cleaner: {pm.cleanerId}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Submitted: {new Date(pm.createdAt).toLocaleString()}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "#fff3cd",
                  }}
                >
                  Pending
                </span>
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: "#f7f7f7",
                  borderRadius: 10,
                }}
              >
                {pm.methodType === "BANK" ? (
                  <>
                    <div>
                      <b>Bank:</b> {d.bankName || "-"}
                    </div>
                    <div>
                      <b>Routing:</b> {maskKeepLast(d.routingNumber || "", 4)}
                    </div>
                    <div>
                      <b>Account:</b> {maskKeepLast(d.accountNumber || "", 4)}
                    </div>
                  </>
                ) : (
                  <div>
                    <b>Handle/Email:</b> {maskKeepLast(d.handle || d.email || d.phone || "", 4)}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <input
                  placeholder="Admin note (optional)"
                  value={note[pm.id] || ""}
                  onChange={(e) =>
                    setNote((s) => ({ ...s, [pm.id]: e.target.value }))
                  }
                  style={{
                    flex: 1,
                    minWidth: 260,
                    padding: 10,
                    borderRadius: 10,
                    border: "1px solid #ddd",
                  }}
                />
                <button
                  onClick={() => verify(pm.id, "reject")}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "#fee",
                    border: "1px solid #fcc",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Reject
                </button>
                <button
                  onClick={() => verify(pm.id, "approve")}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "#28a745",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Approve
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

