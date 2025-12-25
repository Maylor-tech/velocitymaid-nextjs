"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle, XCircle, Send, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: any;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export default function CleanerNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cleaner/notifications");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch notifications");
      }

      setNotifications(data.notifications || []);
    } catch (err: any) {
      console.error("Failed to fetch notifications:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    if (markingRead === notificationId) return;

    setMarkingRead(notificationId);
    try {
      const res = await fetch(`/api/cleaner/notifications/${notificationId}/read`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to mark notification as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        )
      );
    } catch (err: any) {
      console.error("Failed to mark notification as read:", err);
      alert(err.message || "Failed to mark notification as read");
    } finally {
      setMarkingRead(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "PAYOUT_SENT":
        return <Send className="w-5 h-5 text-purple-600" />;
      case "PAYOUT_PAID":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "PAYOUT_FAILED":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "PAYOUT_SENT":
        return "border-purple-200 bg-purple-50";
      case "PAYOUT_PAID":
        return "border-green-200 bg-green-50";
      case "PAYOUT_FAILED":
        return "border-red-200 bg-red-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/cleaner/jobs"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Jobs
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-gray-600 text-sm">
                  {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No notifications</p>
            <p className="text-sm text-gray-400 mt-2">
              You'll be notified about important updates here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const isUnread = !notification.read;
              const payoutId = notification.metadata?.payoutId;

              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow border-2 ${
                    isUnread
                      ? getNotificationColor(notification.type)
                      : "border-gray-200"
                  } p-6`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-gray-700 mb-3">{notification.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{formatDate(notification.createdAt)}</span>
                            {isUnread && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {payoutId && (
                            <Link
                              href={`/cleaner/payouts/${payoutId}`}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                            >
                              View Receipt
                            </Link>
                          )}
                          {isUnread && (
                            <button
                              onClick={() => handleMarkRead(notification.id)}
                              disabled={markingRead === notification.id}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 disabled:opacity-50"
                            >
                              {markingRead === notification.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Mark Read"
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}














