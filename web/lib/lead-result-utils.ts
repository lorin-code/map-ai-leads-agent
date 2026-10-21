import type { AgentLead, AgentState } from "./agent-types";

export type LeadSortOption = "rating-desc" | "rating-asc" | "name-asc";

export type LeadFilterOptions = {
  district?: string;
  phoneOnly?: boolean;
  query?: string;
  sortBy?: LeadSortOption;
};

const CSV_HEADERS = [
  ["名称", "name"],
  ["分类", "type"],
  ["区域", "district"],
  ["地址", "address"],
  ["电话", "tel"],
  ["评分/消费", "ratingCost"],
  ["营业时间", "openTimeText"],
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  automotive: "汽车",
  restaurant: "餐饮",
  hotel: "酒店",
  education: "教育培训",
  fitness: "健身",
  beauty: "美容美发",
  medical: "医疗",
  retail: "零售",
};

function text(value: unknown) {
  return value === undefined || value === null ? "" : String(value);
}

function ratingValue(lead: AgentLead) {
  const parsed = Number.parseFloat(text(lead.rating));
  return Number.isFinite(parsed) ? parsed : -1;
}

function matchesQuery(lead: AgentLead, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [lead.name, lead.type, lead.typecode, lead.district, lead.businessArea, lead.address, lead.tel, lead.adcode]
    .map((value) => text(value).toLowerCase())
    .some((value) => value.includes(normalized));
}

export function uniqueDistricts(results: AgentLead[]) {
  return [...new Set(results.map((lead) => text(lead.district)).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
}

export function filterAndSortLeads(results: AgentLead[], options: LeadFilterOptions = {}) {
  const district = options.district || "";
  const sortBy = options.sortBy || "rating-desc";

  const filtered = results.filter((lead) => {
    if (options.phoneOnly && !text(lead.tel).trim()) {
      return false;
    }

    if (district && text(lead.district) !== district) {
      return false;
    }

    return matchesQuery(lead, options.query || "");
  });

  return [...filtered].sort((left, right) => {
    if (sortBy === "rating-asc") {
      return ratingValue(left) - ratingValue(right);
    }

    if (sortBy === "name-asc") {
      return text(left.name).localeCompare(text(right.name), "zh-CN");
    }

    return ratingValue(right) - ratingValue(left);
  });
}

function escapeCsv(value: unknown) {
  const valueText = text(value);
  if (/[",\n\r]/.test(valueText)) {
    return `"${valueText.replaceAll('"', '""')}"`;
  }
  return valueText;
}

export function buildLeadCsv(results: AgentLead[]) {
  const lines = [CSV_HEADERS.map(([label]) => label).join(",")];
  for (const lead of results) {
    lines.push(
      CSV_HEADERS.map(([, key]) => {
        if (key === "ratingCost") {
          return escapeCsv(
            [lead.rating ? `评分 ${lead.rating}` : "", lead.cost ? `人均 ${lead.cost}` : ""]
              .filter(Boolean)
              .join(" / "),
          );
        }

        if (key === "openTimeText") {
          return escapeCsv([lead.openTime, lead.openTimeDetail].filter(Boolean).join(" / "));
        }

        return escapeCsv(lead[key as keyof AgentLead]);
      }).join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function safeFilenamePart(value: unknown) {
  return text(value)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "")
    .slice(0, 28);
}

function dateStamp() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

export function buildLeadDownloadFilename({
  extension,
  filtered = false,
  results,
  state,
}: {
  extension: "csv" | "json";
  filtered?: boolean;
  results: AgentLead[];
  state?: AgentState | null;
}) {
  const parts = [
    "AI线索助手",
    safeFilenamePart(state?.city),
    safeFilenamePart(state?.district),
    safeFilenamePart(state?.subcategory || CATEGORY_LABELS[state?.category || ""] || state?.category),
    filtered ? "筛选" : "",
    results.length ? `${results.length}条` : "",
    dateStamp(),
  ].filter(Boolean);

  return `${parts.join("-")}.${extension}`;
}
