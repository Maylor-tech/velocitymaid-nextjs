"use client";

import { X } from "lucide-react";
import PaymentMethodForm from "./PaymentMethodForm";

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isUpdate?: boolean;
  initialMethodType?: string;
}

export default function AddPaymentMethodModal({
  isOpen,
  onClose,
  onSuccess,
  isUpdate = false,
  initialMethodType,
}: AddPaymentMethodModalProps) {
  if (!isOpen) return null;

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isUpdate ? "Update Payment Method" : "Add Payment Method"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your payment method will be saved and marked
            as pending verification. You'll receive payouts once verified by an
            administrator.
          </p>
        </div>

        <PaymentMethodForm
          onSuccess={handleSuccess}
          onCancel={onClose}
          initialMethodType={initialMethodType}
        />
      </div>
    </div>
  );
}
















