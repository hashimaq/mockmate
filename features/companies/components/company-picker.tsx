"use client";

import { useMemo, useState } from "react";
import { Building2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanyAvatar } from "@/features/companies/components/company-avatar";
import {
  CUSTOM_COMPANY_ID,
  NO_COMPANY_ID,
  listCompanyOptions,
} from "@/services/companies/company-profiles";
import { cn } from "@/lib/utils";

type CompanyPickerProps = {
  companyId: string;
  customCompanyName: string;
  onCompanyIdChange: (id: string) => void;
  onCustomCompanyNameChange: (name: string) => void;
};

export function CompanyPicker({
  companyId,
  customCompanyName,
  onCompanyIdChange,
  onCustomCompanyNameChange,
}: CompanyPickerProps) {
  const [query, setQuery] = useState("");
  const companies = useMemo(() => listCompanyOptions(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((company) =>
      company.name.toLowerCase().includes(q),
    );
  }, [companies, query]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="company-search">Search companies</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="company-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Google, Amazon, Arbisoft…"
            className="pl-9"
            aria-controls="company-options"
          />
        </div>
      </div>

      <div
        id="company-options"
        role="listbox"
        aria-label="Target company"
        className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2"
      >
        <button
          type="button"
          role="option"
          aria-selected={companyId === NO_COMPANY_ID}
          onClick={() => onCompanyIdChange(NO_COMPANY_ID)}
          className={cn(
            "flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            companyId === NO_COMPANY_ID
              ? "border-primary bg-primary/10"
              : "border-border/80 bg-background/60 hover:border-primary/30",
          )}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-muted/40">
            <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
          </span>
          <span>
            <span className="block text-sm font-semibold text-foreground">
              No target company
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Optional — skip company-specific style
            </span>
          </span>
        </button>

        {filtered.map((company) => (
          <button
            key={company.id}
            type="button"
            role="option"
            aria-selected={companyId === company.id}
            onClick={() => onCompanyIdChange(company.id)}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              companyId === company.id
                ? "border-primary bg-primary/10"
                : "border-border/80 bg-background/60 hover:border-primary/30",
            )}
          >
            <CompanyAvatar companyName={company.name} />
            <span className="text-sm font-semibold text-foreground">
              {company.name}
            </span>
          </button>
        ))}

        <button
          type="button"
          role="option"
          aria-selected={companyId === CUSTOM_COMPANY_ID}
          onClick={() => onCompanyIdChange(CUSTOM_COMPANY_ID)}
          className={cn(
            "flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:col-span-2",
            companyId === CUSTOM_COMPANY_ID
              ? "border-primary bg-primary/10"
              : "border-border/80 bg-background/60 hover:border-primary/30",
          )}
        >
          <CompanyAvatar companyName={customCompanyName || "Custom"} />
          <span>
            <span className="block text-sm font-semibold text-foreground">
              Custom Company
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Enter any company not listed above
            </span>
          </span>
        </button>
      </div>

      {companyId === CUSTOM_COMPANY_ID ? (
        <div className="space-y-2">
          <Label htmlFor="custom-company">Custom company name</Label>
          <Input
            id="custom-company"
            value={customCompanyName}
            onChange={(event) =>
              onCustomCompanyNameChange(event.target.value)
            }
            placeholder="e.g. Acme Corp"
            autoFocus
            maxLength={80}
          />
        </div>
      ) : null}
    </div>
  );
}
