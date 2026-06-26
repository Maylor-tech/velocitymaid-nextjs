/**
 * Admin Command Center Dashboard
 *
 * /admin
 *
 * Live operational command center: market stats, job pipeline, contact
 * messages, and quick actions. Every metric reflects live business data.
 */

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Clock,
  Archive,
  MessageSquare,
  MapPin,
  Loader2,
  Plus,
  DollarSign,
} from "lucide-react";

interface MessageMetrics {
  NEW: number;
  REVIEWED: number;
  REPLIED: number;
  ARCHIVED: number;
  total: number;
}

interface MarketStat {
  activeClients: number;
  completedThisMonth: number;
  revenueThisMonth: number;
}

interface PipelineStats {
  scheduled: number;
  inProgress: number;
  completed: number;
  archived: number;
}

interface CommandCenterStats {
  markets: {
    vermont: MarketStat;
    "new-jersey": MarketStat;
  };
  pipeline: PipelineStats;
}

const EMPTY_MARKET: MarketStat = {
  activeClients: 0,
  completedThisMonth: 0,
  revenueThisMonth: 0,
};

const EMPTY_STATS: CommandCenterStats = {
  markets: { vermont: EMPTY_MARKET, "new-jersey": EMPTY_MARKET },
  pipeline: { scheduled: 0, inProgress: 0, completed: 0, archived: 0 },
};

const num = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;

const formatMoney = (v: unknown): string =>
  `$${num(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/** Card matching the existing Contact Messages icon-box style. */
function MetricCard({
  title,
  count,
  status,
  href,
  icon: Icon,
  color,
  iconColor = "text-white",
}: {
  title: string;
  count: number;
  status?: string;
  href: string;
  icon: any;
  color: string;
  iconColor?: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-vm-muted">{title}</p>
            <p className="text-2xl font-semibold text-vm-text mt-1">{count}</p>
            {status && <p className="text-xs text-vm-muted mt-1">{status}</p>}
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-vm-muted" />
      </div>
    </Link>
  );
}

function MarketStatItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-2xl font-semibold text-vm-navy">{value}</p>
      <p className="mt-1 text-xs font-medium text-vm-muted">{label}</p>
    </div>
  );
}

function MarketCard({
  label,
  clientsLabel,
  turnoverLabel,
  stat,
}: {
  label: string;
  clientsLabel: string;
  turnoverLabel: string;
  stat: MarketStat;
}) {
  return (
    <div className="rounded-xl border border-vm-border bg-white p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-vm-navy">
          <MapPin className="h-4 w-4 text-white" />
        </span>
        <h3 className="text-base font-semibold text-vm-navy">{label}</h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <MarketStatItem label={clientsLabel} value={num(stat.activeClients)} />
        <MarketStatItem
          label={turnoverLabel}
          value={num(stat.completedThisMonth)}
        />
        <MarketStatItem
          label="Revenue This Month"
          value={formatMoney(stat.revenueThisMonth)}
        />
      </div>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: any;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-2 rounded-lg border border-vm-navy/30 bg-white px-4 py-3 text-sm font-semibold text-vm-navy transition-colors hover:bg-vm-navy/5"
    >
      <Icon className="h-4 w-4 text-vm-cyan" />
      {label}
    </Link>
  );
}

export default function AdminCommandCenter() {
  const pathname = usePathname();
  const [messages, setMessages] = useState<MessageMetrics | null>(null);
  const [stats, setStats] = useState<CommandCenterStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    const handleStatusUpdate = () => {
      fetchData();
    };
    window.addEventListener("messageStatusUpdated", handleStatusUpdate);

    return () => {
      window.removeEventListener("messageStatusUpdated", handleStatusUpdate);
    };
  }, []);

  useEffect(() => {
    if (pathname === "/admin") {
      fetchData();
    }
  }, [pathname]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, statsRes] = await Promise.all([
        fetch("/api/admin/dashboard/metrics", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/admin/dashboard/command-center", {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      const metricsData = await metricsRes.json();
      const statsData = await statsRes.json();

      if (!metricsData.success) {
        throw new Error(metricsData.error || "Failed to fetch metrics");
      }

      const m = metricsData.metrics || {};
      setMessages({
        NEW: num(m.NEW),
        REVIEWED: num(m.REVIEWED),
        REPLIED: num(m.REPLIED),
        ARCHIVED: num(m.ARCHIVED),
        total: num(m.NEW) + num(m.REVIEWED) + num(m.REPLIED) + num(m.ARCHIVED),
      });

      if (statsData.success) {
        const vermont = statsData.markets?.vermont ?? EMPTY_MARKET;
        const newJersey = statsData.markets?.["new-jersey"] ?? EMPTY_MARKET;
        const pipeline = statsData.pipeline ?? EMPTY_STATS.pipeline;
        setStats({
          markets: {
            vermont: {
              activeClients: num(vermont.activeClients),
              completedThisMonth: num(vermont.completedThisMonth),
              revenueThisMonth: num(vermont.revenueThisMonth),
            },
            "new-jersey": {
              activeClients: num(newJersey.activeClients),
              completedThisMonth: num(newJersey.completedThisMonth),
              revenueThisMonth: num(newJersey.revenueThisMonth),
            },
          },
          pipeline: {
            scheduled: num(pipeline.scheduled),
            inProgress: num(pipeline.inProgress),
            completed: num(pipeline.completed),
            archived: num(pipeline.archived),
          },
        });
      } else {
        setStats(EMPTY_STATS);
      }
    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vm-navy"></div>
        </div>
      </div>
    );
  }

  if (error || !messages) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-md bg-red-50 border border-red-200 p-6">
          <p className="text-red-800">{error || "Failed to load dashboard"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-vm-navy">Command Center</h1>
        <p className="mt-2 text-sm text-vm-muted">
          Live operational snapshot — jobs, revenue, clients, and messages
          across Vermont and New Jersey.
        </p>
      </div>

      {/* Market Stats Row */}
      <div className="mb-12">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <MarketCard
            label="Vermont — Okemo Valley"
            clientsLabel="Active Host Accounts"
            turnoverLabel="Turnovers This Month"
            stat={stats.markets.vermont}
          />
          <MarketCard
            label="New Jersey"
            clientsLabel="Active Residential Clients"
            turnoverLabel="Cleans This Month"
            stat={stats.markets["new-jersey"]}
          />
        </div>
      </div>

      {/* Job Pipeline Stats */}
      <div className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center text-lg font-medium text-vm-navy">
            <Briefcase className="mr-2 h-5 w-5" />
            Job Pipeline
          </h2>
          <Link
            href="/admin/jobs"
            className="flex items-center text-sm text-vm-muted hover:text-vm-navy"
          >
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Scheduled"
            count={stats.pipeline.scheduled}
            status="Upcoming"
            href="/admin/jobs"
            icon={Clock}
            color="bg-vm-navy"
          />
          <MetricCard
            title="In Progress"
            count={stats.pipeline.inProgress}
            status="Active now"
            href="/admin/jobs"
            icon={Loader2}
            color="bg-vm-cyan"
          />
          <MetricCard
            title="Completed"
            count={stats.pipeline.completed}
            status="All time"
            href="/admin/jobs"
            icon={CheckCircle2}
            color="bg-vm-success-bg"
            iconColor="text-vm-success"
          />
          <MetricCard
            title="Archived"
            count={stats.pipeline.archived}
            status="Soft-deleted"
            href="/admin/jobs"
            icon={Archive}
            color="bg-gray-400"
          />
        </div>
      </div>

      {/* Messages Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-vm-text flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Contact Messages
          </h2>
          <Link
            href="/admin/inbox"
            className="text-sm text-vm-muted hover:text-vm-text flex items-center"
          >
            View all
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="New Messages"
            count={messages.NEW}
            status="Requires attention"
            href="/admin/inbox?status=NEW"
            icon={Mail}
            color="bg-amber-600"
          />
          <MetricCard
            title="Reviewed"
            count={messages.REVIEWED}
            status="In progress"
            href="/admin/inbox?status=REVIEWED"
            icon={Clock}
            color="bg-gray-600"
          />
          <MetricCard
            title="Replied"
            count={messages.REPLIED}
            status="Response sent"
            href="/admin/inbox?status=REPLIED"
            icon={CheckCircle2}
            color="bg-vm-success-bg"
            iconColor="text-vm-success"
          />
          <MetricCard
            title="Archived"
            count={messages.ARCHIVED}
            status="Completed"
            href="/admin/inbox?status=ARCHIVED"
            icon={Archive}
            color="bg-gray-400"
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-vm-muted">
            Total:{" "}
            <span className="font-medium text-vm-text">{messages.total}</span>{" "}
            messages
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-vm-border pt-8">
        <h2 className="mb-4 text-lg font-medium text-vm-navy">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <QuickAction href="/admin/jobs/new" label="New Job" icon={Plus} />
          <QuickAction href="/admin/jobs" label="View All Jobs" icon={Briefcase} />
          <QuickAction href="/tip" label="Tip Activity" icon={DollarSign} />
        </div>
      </div>
    </div>
  );
}
