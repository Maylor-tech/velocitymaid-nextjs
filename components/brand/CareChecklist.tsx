"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Circle } from "lucide-react";
import {
  CARE_CHECKLIST,
  CARE_CHECKLIST_CATEGORIES,
  CARE_CHECKLIST_TOTAL,
  getChecklistProgress,
} from "@/lib/brand/careChecklist";

export type CareChecklistMode = "readonly" | "interactive" | "audit";

export interface ChecklistAuditEntry {
  itemId: string;
  completedAt: string;
  completedBy?: string;
}

export interface CareChecklistProps {
  mode: CareChecklistMode;
  completedIds?: string[];
  onToggle?: (itemId: string, checked: boolean) => void;
  auditLog?: ChecklistAuditEntry[];
  title?: string;
  defaultExpanded?: boolean;
  className?: string;
}

export function CareChecklist({
  mode,
  completedIds = [],
  onToggle,
  auditLog = [],
  title = "50-Point Hospitality Standards",
  defaultExpanded = true,
  className = "",
}: CareChecklistProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const auditByItem = useMemo(() => {
    const m = new Map<string, ChecklistAuditEntry>();
    for (const e of auditLog) m.set(e.itemId, e);
    return m;
  }, [auditLog]);

  const progress = getChecklistProgress(completedIds);

  return (
    <div className={`card-brand ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-4 text-left"
        aria-expanded={expanded}
      >
        <div>
          <h3 className="text-xl font-serif font-bold tracking-tight text-vm-navy">
            {title}
          </h3>
          <p className="text-xs font-sans font-bold uppercase tracking-wider text-vm-text/60 mt-1">
            {progress.completed} of {CARE_CHECKLIST_TOTAL} certified
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="trust-badge text-[10px] font-sans font-bold uppercase tracking-wider text-vm-cyan">
            {progress.percent}%
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-vm-text/50" />
          ) : (
            <ChevronDown className="w-5 h-5 text-vm-text/50" />
          )}
        </div>
      </button>

      <div className="mt-3 h-1.5 rounded-full bg-vm-navy/10 overflow-hidden">
        <div
          className="h-full bg-vm-cyan transition-all duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      {expanded && (
        <div className="mt-6 space-y-6">
          {CARE_CHECKLIST_CATEGORIES.map((category) => {
            const items = CARE_CHECKLIST.filter(
              (i) => i.categoryId === category.id
            );
            return (
              <section key={category.id}>
                <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-vm-navy mb-3">
                  {category.title}
                </h4>
                <ul className="space-y-2">
                  {items.map((item) => {
                    const done = completedSet.has(item.id);
                    const audit = auditByItem.get(item.id);

                    if (mode === "audit") {
                      return (
                        <li
                          key={item.id}
                          className="flex items-start justify-between gap-3 py-2 border-b border-vm-navy/5 last:border-0"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            {done ? (
                              <Check className="w-4 h-4 text-vm-cyan shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-4 h-4 text-vm-text/30 shrink-0 mt-0.5" />
                            )}
                            <span
                              className={`text-sm font-sans font-medium ${
                                done ? "text-vm-text" : "text-vm-text/50"
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                          {audit && (
                            <span className="text-[10px] font-sans text-vm-text/50 shrink-0 text-right">
                              {new Date(audit.completedAt).toLocaleString()}
                              {audit.completedBy && (
                                <span className="block">{audit.completedBy}</span>
                              )}
                            </span>
                          )}
                        </li>
                      );
                    }

                    if (mode === "interactive") {
                      return (
                        <li key={item.id}>
                          <label className="flex items-center gap-3 py-2.5 px-3 rounded-lg border border-vm-navy/10 bg-white hover:border-vm-navy/20 cursor-pointer min-h-[44px]">
                            <input
                              type="checkbox"
                              checked={done}
                              onChange={(e) =>
                                onToggle?.(item.id, e.target.checked)
                              }
                              className="h-5 w-5 rounded border-vm-navy/30 text-vm-navy focus:ring-vm-cyan"
                            />
                            <span className="text-sm font-sans font-medium text-vm-text">
                              {item.label}
                            </span>
                          </label>
                        </li>
                      );
                    }

                    // readonly
                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-2.5 py-1.5"
                      >
                        {done ? (
                          <Check className="w-4 h-4 text-vm-cyan shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-4 h-4 text-vm-text/25 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-sm font-sans font-medium ${
                            done ? "text-vm-text" : "text-vm-text/40"
                          }`}
                        >
                          {item.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
