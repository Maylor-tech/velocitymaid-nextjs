"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Download,
  Loader2,
  Mail,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import FormRow from "@/components/customer/actions/FormRow";
import Toast from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildConfirmSubject,
  buildDefaultEmailSubject,
  buildDefaultValidUntil,
  DEFAULT_INCLUSIONS,
  DEFAULT_QUOTE_SENDER,
  formatQuoteValidUntil,
  addDays,
} from "@/lib/admin/quoteDefaults";
import {
  renderQuoteEmail,
  type QuoteEmailData,
  type QuoteEmailLineItem,
} from "@/lib/email/quoteEmail";

const inputClass =
  "w-full rounded-lg border border-vm-border px-4 py-3 font-body text-sm text-vm-text outline-none focus:border-vm-cyan focus:ring-1 focus:ring-vm-cyan";
const textareaClass = `${inputClass} min-h-[96px] resize-y`;

type QuoteFormState = {
  toEmail: string;
  customerPhone: string;
  emailSubject: string;
  clientFirstName: string;
  clientFullName: string;
  propertyAddress: string;
  serviceDate: string;
  startTime: string;
  access: string;
  quoteNumber: string;
  validUntil: string;
  serviceTitle: string;
  totalDue: string;
  paymentNote: string;
  confirmSubject: string;
  inclusionsText: string;
  senderName: string;
  senderTitle: string;
  senderPhone: string;
  senderEmail: string;
  senderWebsite: string;
};

type LineItemForm = QuoteEmailLineItem & { id: string };

function createLineItem(label = "", amount = ""): LineItemForm {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label,
    amount,
  };
}

function buildInitialForm(): QuoteFormState {
  const validUntilDate = addDays(new Date(), 14);
  return {
    toEmail: "",
    customerPhone: "",
    emailSubject: "",
    clientFirstName: "",
    clientFullName: "",
    propertyAddress: "",
    serviceDate: "",
    startTime: "",
    access: "",
    quoteNumber: "",
    validUntil: formatQuoteValidUntil(validUntilDate),
    serviceTitle: "",
    totalDue: "",
    paymentNote:
      "Payment due via PayPal to hello@velocitymaid.com — we will confirm once received.",
    confirmSubject: "",
    inclusionsText: DEFAULT_INCLUSIONS.join("\n"),
    senderName: DEFAULT_QUOTE_SENDER.name,
    senderTitle: DEFAULT_QUOTE_SENDER.title,
    senderPhone: DEFAULT_QUOTE_SENDER.phone,
    senderEmail: DEFAULT_QUOTE_SENDER.email,
    senderWebsite: DEFAULT_QUOTE_SENDER.website,
  };
}

function QuoteComposerInner() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customer");
  const jobId = searchParams.get("jobId");

  const [form, setForm] = useState<QuoteFormState>(buildInitialForm);
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    createLineItem("", ""),
  ]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [sending, setSending] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const updateForm = useCallback(
    (key: keyof QuoteFormState, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoadingMeta(true);
      try {
        const numberRes = await fetch("/api/admin/quotes/next-number");
        const numberData = await numberRes.json();

        if (!cancelled && numberData.success && numberData.quoteNumber) {
          setForm((prev) => {
            const quoteNumber = numberData.quoteNumber as string;
            return {
              ...prev,
              quoteNumber,
              validUntil: prev.validUntil || buildDefaultValidUntil(),
              confirmSubject:
                prev.confirmSubject ||
                buildConfirmSubject(quoteNumber, prev.propertyAddress || "your property"),
              emailSubject:
                prev.emailSubject ||
                buildDefaultEmailSubject(quoteNumber, prev.serviceTitle || "Cleaning quote"),
            };
          });
        }

        if (customerId || jobId) {
          const params = new URLSearchParams();
          if (jobId) params.set("jobId", jobId);
          else if (customerId) params.set("customerId", customerId);

          const prefillRes = await fetch(
            `/api/admin/quotes/prefill?${params.toString()}`
          );
          const prefillData = await prefillRes.json();

            if (!cancelled && prefillData.success && prefillData.data) {
            const d = prefillData.data;
            const quoteNumber =
              numberData.success && numberData.quoteNumber
                ? numberData.quoteNumber
                : "";
            const serviceTitle = d.serviceTitle || "";
            const propertyAddress = d.propertyAddress || "";

            setForm((prev) => ({
              ...prev,
              toEmail: d.clientEmail || prev.toEmail,
              customerPhone: d.clientPhone || prev.customerPhone,
              clientFirstName: d.clientFirstName || prev.clientFirstName,
              clientFullName: d.clientFullName || prev.clientFullName,
              propertyAddress,
              serviceDate: d.serviceDate || prev.serviceDate,
              startTime: d.startTime || prev.startTime,
              serviceTitle,
              totalDue: d.totalDue || prev.totalDue,
              quoteNumber: quoteNumber || prev.quoteNumber,
              confirmSubject: buildConfirmSubject(
                quoteNumber || prev.quoteNumber,
                propertyAddress || "your property"
              ),
              emailSubject: buildDefaultEmailSubject(
                quoteNumber || prev.quoteNumber,
                serviceTitle || "Cleaning quote"
              ),
            }));

            if (Array.isArray(d.lineItems) && d.lineItems.length > 0) {
              setLineItems(
                d.lineItems.map((item: QuoteEmailLineItem) =>
                  createLineItem(item.label, item.amount)
                )
              );
            } else if (serviceTitle && d.totalDue) {
              setLineItems([createLineItem(serviceTitle, d.totalDue)]);
            }
          }
        }
      } catch (error) {
        console.error("Quote composer bootstrap failed:", error);
        if (!cancelled) {
          showToast("Could not load quote defaults", "error");
        }
      } finally {
        if (!cancelled) {
          setLoadingMeta(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, jobId]);

  const quoteEmailData: QuoteEmailData = useMemo(() => {
    const inclusions = form.inclusionsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      clientFirstName: form.clientFirstName || "there",
      clientFullName: form.clientFullName || form.clientFirstName || "Customer",
      propertyAddress: form.propertyAddress || "your property",
      serviceDate: form.serviceDate || "TBD",
      startTime: form.startTime || "TBD",
      access: form.access.trim() || undefined,
      quoteNumber: form.quoteNumber || "VM-Q-0000",
      validUntil: form.validUntil || buildDefaultValidUntil(),
      serviceTitle: form.serviceTitle || "Cleaning service",
      lineItems: lineItems
        .filter((item) => item.label.trim() || item.amount.trim())
        .map(({ label, amount }) => ({ label, amount })),
      totalDue: form.totalDue || "$0.00",
      inclusions: inclusions.length > 0 ? inclusions : DEFAULT_INCLUSIONS,
      paymentNote: form.paymentNote,
      confirmSubject: form.confirmSubject,
      sender: {
        name: form.senderName,
        title: form.senderTitle,
        phone: form.senderPhone,
        email: form.senderEmail,
        website: form.senderWebsite,
      },
    };
  }, [form, lineItems]);

  const previewHtml = useMemo(
    () => renderQuoteEmail(quoteEmailData),
    [quoteEmailData]
  );

  const telHref = useMemo(() => {
    const digits = form.customerPhone.replace(/\D/g, "");
    if (!digits) return "";
    return digits.startsWith("1") ? `tel:+${digits}` : `tel:+1${digits}`;
  }, [form.customerPhone]);

  const handleSend = async () => {
    if (!form.toEmail.trim()) {
      showToast("Recipient email is required", "error");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/quotes/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: form.toEmail.trim(),
          subject: form.emailSubject.trim(),
          html: previewHtml,
          replyTo: form.senderEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send email");
      }
      showToast("Quote email sent successfully", "success");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to send email";
      showToast(message, "error");
    } finally {
      setSending(false);
    }
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(previewHtml);
      showToast("HTML copied to clipboard", "success");
    } catch {
      showToast("Could not copy HTML", "error");
    }
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([previewHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${form.quoteNumber || "velocitymaid-quote"}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast("Quote HTML downloaded", "success");
  };

  if (loadingMeta) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/jobs"
          className="inline-flex items-center gap-2 font-body text-sm text-vm-muted hover:text-vm-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-vm-navy">
          Send quote
        </h1>
        <p className="mt-1 font-body text-sm text-vm-muted">
          Compose a branded quote email and send it to the customer, or copy the
          HTML for Gmail.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <Card className="border-vm-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-vm-navy">
              Quote details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow label="Recipient email" required>
              <input
                type="email"
                value={form.toEmail}
                onChange={(e) => updateForm("toEmail", e.target.value)}
                className={inputClass}
                placeholder="customer@example.com"
              />
            </FormRow>

            <FormRow label="Customer phone" helpText="Used for one-tap Call customer">
              <input
                type="tel"
                value={form.customerPhone}
                onChange={(e) => updateForm("customerPhone", e.target.value)}
                className={inputClass}
                placeholder="+1-xxx-xxx-xxxx"
              />
            </FormRow>

            <FormRow label="Email subject" required>
              <input
                type="text"
                value={form.emailSubject}
                onChange={(e) => updateForm("emailSubject", e.target.value)}
                className={inputClass}
              />
            </FormRow>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormRow label="Client first name" required>
                <input
                  type="text"
                  value={form.clientFirstName}
                  onChange={(e) => updateForm("clientFirstName", e.target.value)}
                  className={inputClass}
                />
              </FormRow>
              <FormRow label="Client full name" required>
                <input
                  type="text"
                  value={form.clientFullName}
                  onChange={(e) => updateForm("clientFullName", e.target.value)}
                  className={inputClass}
                />
              </FormRow>
            </div>

            <FormRow label="Property address" required>
              <input
                type="text"
                value={form.propertyAddress}
                onChange={(e) => updateForm("propertyAddress", e.target.value)}
                className={inputClass}
              />
            </FormRow>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormRow label="Service date" required>
                <input
                  type="text"
                  value={form.serviceDate}
                  onChange={(e) => updateForm("serviceDate", e.target.value)}
                  className={inputClass}
                  placeholder="Wednesday, July 9, 2026"
                />
              </FormRow>
              <FormRow label="Start time" required>
                <input
                  type="text"
                  value={form.startTime}
                  onChange={(e) => updateForm("startTime", e.target.value)}
                  className={inputClass}
                  placeholder="9:00 AM"
                />
              </FormRow>
              <FormRow label="Access">
                <input
                  type="text"
                  value={form.access}
                  onChange={(e) => updateForm("access", e.target.value)}
                  className={inputClass}
                  placeholder="Keypad entry"
                />
              </FormRow>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormRow label="Quote number" required>
                <input
                  type="text"
                  value={form.quoteNumber}
                  onChange={(e) => updateForm("quoteNumber", e.target.value)}
                  className={inputClass}
                />
              </FormRow>
              <FormRow label="Valid until" required>
                <input
                  type="text"
                  value={form.validUntil}
                  onChange={(e) => updateForm("validUntil", e.target.value)}
                  className={inputClass}
                />
              </FormRow>
            </div>

            <FormRow label="Service title" required>
              <input
                type="text"
                value={form.serviceTitle}
                onChange={(e) => updateForm("serviceTitle", e.target.value)}
                className={inputClass}
                placeholder="Post-Renovation Deep Clean"
              />
            </FormRow>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-heading text-sm font-semibold text-vm-navy">
                  Line items
                </p>
                <Button
                  type="button"
                  variant="navyOutline"
                  size="sm"
                  onClick={() =>
                    setLineItems((prev) => [...prev, createLineItem()])
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add line
                </Button>
              </div>
              {lineItems.map((item, index) => (
                <div key={item.id} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) =>
                      setLineItems((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, label: e.target.value } : row
                        )
                      )
                    }
                    className={inputClass}
                    placeholder="Service description"
                  />
                  <input
                    type="text"
                    value={item.amount}
                    onChange={(e) =>
                      setLineItems((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, amount: e.target.value } : row
                        )
                      )
                    }
                    className={inputClass}
                    placeholder="$375.00"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setLineItems((prev) =>
                        prev.length === 1
                          ? prev
                          : prev.filter((row) => row.id !== item.id)
                      )
                    }
                    aria-label="Remove line item"
                  >
                    <Trash2 className="h-4 w-4 text-vm-muted" />
                  </Button>
                </div>
              ))}
            </div>

            <FormRow label="Total due" required>
              <input
                type="text"
                value={form.totalDue}
                onChange={(e) => updateForm("totalDue", e.target.value)}
                className={inputClass}
                placeholder="$375.00"
              />
            </FormRow>

            <FormRow label="What's included" helpText="One item per line">
              <textarea
                value={form.inclusionsText}
                onChange={(e) => updateForm("inclusionsText", e.target.value)}
                className={textareaClass}
              />
            </FormRow>

            <FormRow label="Payment note">
              <textarea
                value={form.paymentNote}
                onChange={(e) => updateForm("paymentNote", e.target.value)}
                className={textareaClass}
              />
            </FormRow>

            <FormRow label="Confirm mailto subject">
              <input
                type="text"
                value={form.confirmSubject}
                onChange={(e) => updateForm("confirmSubject", e.target.value)}
                className={inputClass}
              />
            </FormRow>

            <div className="border-t border-vm-border pt-4">
              <p className="mb-3 font-heading text-sm font-semibold text-vm-navy">
                Sender signature
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormRow label="Name">
                  <input
                    type="text"
                    value={form.senderName}
                    onChange={(e) => updateForm("senderName", e.target.value)}
                    className={inputClass}
                  />
                </FormRow>
                <FormRow label="Title">
                  <input
                    type="text"
                    value={form.senderTitle}
                    onChange={(e) => updateForm("senderTitle", e.target.value)}
                    className={inputClass}
                  />
                </FormRow>
                <FormRow label="Phone">
                  <input
                    type="text"
                    value={form.senderPhone}
                    onChange={(e) => updateForm("senderPhone", e.target.value)}
                    className={inputClass}
                  />
                </FormRow>
                <FormRow label="Email">
                  <input
                    type="email"
                    value={form.senderEmail}
                    onChange={(e) => updateForm("senderEmail", e.target.value)}
                    className={inputClass}
                  />
                </FormRow>
              </div>
              <FormRow label="Website">
                <input
                  type="text"
                  value={form.senderWebsite}
                  onChange={(e) => updateForm("senderWebsite", e.target.value)}
                  className={inputClass}
                />
              </FormRow>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-vm-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-vm-navy">
                Live preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-vm-border bg-vm-surface">
                <iframe
                  title="Quote email preview"
                  srcDoc={previewHtml}
                  className="h-[720px] w-full bg-white"
                  sandbox=""
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="cyan"
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send email
                </Button>

                {telHref ? (
                  <a
                    href={telHref}
                    className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-vm-navy/20 bg-transparent px-4 py-2 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition-[transform,background-color,border-color] duration-150 hover:border-vm-navy btn-tactile"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call customer
                  </a>
                ) : (
                  <Button type="button" variant="navyOutline" disabled>
                    <Phone className="mr-2 h-4 w-4" />
                    Call customer
                  </Button>
                )}

                <Button type="button" variant="navyOutline" onClick={handleCopyHtml}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy HTML
                </Button>

                <Button type="button" variant="navyOutline" onClick={handleDownloadHtml}>
                  <Download className="mr-2 h-4 w-4" />
                  Download .html
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function QuoteComposer() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
        </div>
      }
    >
      <QuoteComposerInner />
    </Suspense>
  );
}
