"use client";

import { useEffect, useMemo, useState } from "react";

import { downloadText } from "@/lib/agent-client";
import {
  buildLeadCsv,
  buildLeadDownloadFilename,
  filterAndSortLeads,
  uniqueDistricts,
  type LeadSortOption,
} from "@/lib/lead-result-utils";
import type { AgentDownloads, AgentLead, AgentState, AgentSummary } from "@/lib/agent-types";

type InlineResultsPanelProps = {
  downloads: AgentDownloads;
  results: AgentLead[];
  state?: AgentState | null;
  summary: AgentSummary;
};

const PAGE_SIZE = 100;

function districtBreakdown(results: AgentLead[]) {
  const counts = new Map<string, number>();

  for (const lead of results) {
    if (!lead.district) {
      continue;
    }

    counts.set(lead.district, (counts.get(lead.district) || 0) + 1);
  }

  return [...counts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 6);
}

export function InlineResultsPanel({ downloads, results, state, summary }: InlineResultsPanelProps) {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [phoneOnly, setPhoneOnly] = useState(false);
  const [sortBy, setSortBy] = useState<LeadSortOption>("rating-desc");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const phoneRate = summary.leadCount > 0 ? Math.round((summary.withPhone / summary.leadCount) * 100) : 0;
  const websiteRate =
    summary.leadCount > 0 ? Math.round((summary.withWebsite / summary.leadCount) * 100) : 0;
  const breakdown = districtBreakdown(results);
  const districts = useMemo(() => uniqueDistricts(results), [results]);
  const visibleResults = useMemo(
    () => filterAndSortLeads(results, { district, phoneOnly, query, sortBy }),
    [district, phoneOnly, query, results, sortBy],
  );
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(visibleResults.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedResults = useMemo(
    () => visibleResults.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [safePage, visibleResults],
  );
  useEffect(() => {
    setPage(1);
  }, [district, phoneOnly, query, sortBy, results]);

  const copyText = async (key: string, value: string) => {
    if (!value || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? null : current));
    }, 1500);
  };

  return (
    <section className="mt-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.24em] text-indigo-500">找到的线索</p>
          <h4 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-900">
            名单已经整理好了
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            共找到 {summary.leadCount} 条线索。你可以继续筛选、复制电话，或下载成表格。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:-translate-y-0.5 hover:bg-indigo-100"
            onClick={() =>
              downloadText(
                buildLeadDownloadFilename({ extension: "csv", results, state }),
                buildLeadCsv(results),
                "text/csv;charset=utf-8",
              )
            }
            type="button"
          >
            下载表格
          </button>
          <button
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={visibleResults.length === 0}
            onClick={() =>
              downloadText(
                buildLeadDownloadFilename({
                  extension: "csv",
                  filtered: true,
                  results: visibleResults,
                  state,
                }),
                buildLeadCsv(visibleResults),
                "text/csv;charset=utf-8",
              )
            }
            type="button"
          >
            导出当前筛选
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["线索数", String(summary.leadCount)],
          ["有电话", String(summary.withPhone)],
          ["有网站", String(summary.withWebsite)],
          ["平均评分", summary.averageRating],
        ].map(([label, value]) => (
          <article
            className="rounded-[1.15rem] border border-white/80 bg-white/70 px-4 py-4 shadow-sm"
            key={label}
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
            <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-slate-900">
              {value}
            </p>
          </article>
        ))}
      </div>

      <section className="mt-5 rounded-[1.25rem] border border-white/80 bg-white/70 px-4 py-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_150px_170px]">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">搜索这份名单</span>
            <input
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:ring-2 focus:ring-indigo-500/15"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="名称、地址、电话"
              value={query}
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-500">区域</span>
            <select
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:ring-2 focus:ring-indigo-500/15"
              onChange={(event) => setDistrict(event.target.value)}
              value={district}
            >
              <option value="">全部区域</option>
              {districts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-500">排序</span>
            <select
              className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-200 focus:ring-2 focus:ring-indigo-500/15"
              onChange={(event) => setSortBy(event.target.value as LeadSortOption)}
              value={sortBy}
            >
              <option value="rating-desc">评分从高到低</option>
              <option value="rating-asc">评分从低到高</option>
              <option value="name-asc">名称 A-Z</option>
            </select>
          </label>

          <label className="flex min-h-11 items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 lg:mt-5">
            <input
              checked={phoneOnly}
              className="h-4 w-4 accent-indigo-600"
              onChange={(event) => setPhoneOnly(event.target.checked)}
              type="checkbox"
            />
            只看有电话
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
          <span>
            当前显示 {visibleResults.length} / {results.length} 条
          </span>
          {(query || district || phoneOnly) ? (
            <button
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 transition hover:border-indigo-200"
              onClick={() => {
                setQuery("");
                setDistrict("");
                setPhoneOnly(false);
              }}
              type="button"
            >
              清空筛选
            </button>
          ) : null}
        </div>
      </section>

      <div className="mt-5 space-y-4">
        <div className="overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/92 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-3 border-b border-slate-200/80 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              第 {safePage} / {pageCount} 页，每页最多 {PAGE_SIZE} 条
            </span>
            <div className="flex gap-2">
              <button
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
              >
                上一页
              </button>
              <button
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 disabled:cursor-not-allowed disabled:opacity-45"
                disabled={safePage >= pageCount}
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                type="button"
              >
                下一页
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] border-separate border-spacing-0 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="w-[240px] px-5 py-4 font-medium">名称</th>
                  <th className="w-[170px] px-5 py-4 font-medium">分类</th>
                  <th className="w-[170px] px-5 py-4 font-medium">区域</th>
                  <th className="w-[300px] px-5 py-4 font-medium">地址</th>
                  <th className="w-[170px] px-5 py-4 font-medium">电话</th>
                  <th className="w-[180px] px-5 py-4 font-medium">评分/消费</th>
                  <th className="w-[180px] px-5 py-4 font-medium">营业时间</th>
                </tr>
              </thead>
              <tbody>
                {visibleResults.length === 0 ? (
                  <tr>
                    <td className="px-5 py-10 text-sm text-slate-500" colSpan={7}>
                      当前筛选下没有可展示的线索。
                    </td>
                  </tr>
                ) : null}

                {pagedResults.map((lead, index) => (
                  <tr
                    className="align-top transition hover:bg-cyan-50/45"
                    key={`${lead.id || lead.name || "lead"}-${(safePage - 1) * PAGE_SIZE + index}`}
                  >
                    <td className="border-t border-slate-200/80 px-5 py-5">
                      <div>
                        <p className="text-[15px] font-semibold leading-6 text-slate-900">
                          {lead.name || "-"}
                        </p>
                        {lead.id ? <p className="mt-2 text-xs leading-5 text-slate-500">{lead.id}</p> : null}
                      </div>
                    </td>
                    <td className="border-t border-slate-200/80 px-5 py-5 text-sm leading-6 text-slate-700">
                      <p>{lead.type || "未标注类型"}</p>
                      {lead.typecode ? (
                        <p className="mt-2 text-xs text-slate-500">{lead.typecode}</p>
                      ) : null}
                    </td>
                    <td className="border-t border-slate-200/80 px-5 py-5 text-sm leading-6 text-slate-700">
                      <p>{lead.district || "-"}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {[lead.businessArea, lead.adcode].filter(Boolean).join(" / ") || "暂无商圈"}
                      </p>
                    </td>
                    <td className="border-t border-slate-200/80 px-5 py-5 text-sm leading-6 text-slate-700">
                      <div>
                        <p>{lead.address || "-"}</p>
                        {lead.address ? (
                          <button
                            className="mt-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 transition hover:border-indigo-200 hover:text-slate-900"
                            onClick={() => copyText(`address-${index}`, String(lead.address))}
                            type="button"
                          >
                            {copiedKey === `address-${index}` ? "已复制" : "复制地址"}
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="border-t border-slate-200/80 px-5 py-5 text-sm leading-6 text-slate-700">
                      {lead.tel ? (
                        <div>
                          <p className="font-semibold text-slate-900">{lead.tel}</p>
                          <button
                            className="mt-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 transition hover:border-indigo-200 hover:text-slate-900"
                            onClick={() => copyText(`tel-${index}`, String(lead.tel))}
                            type="button"
                          >
                            {copiedKey === `tel-${index}` ? "已复制" : "复制电话"}
                          </button>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border-t border-slate-200/80 px-5 py-5 text-sm text-slate-700">
                      <span className="inline-flex min-w-12 justify-center rounded-full bg-indigo-50 px-3 py-1.5 font-semibold text-indigo-700">
                        {lead.rating || "-"}
                      </span>
                      {lead.cost ? (
                        <p className="mt-2 text-xs text-slate-500">人均 {lead.cost}</p>
                      ) : null}
                    </td>
                    <td className="border-t border-slate-200/80 px-5 py-5 text-sm leading-6 text-slate-700">
                      <p>{lead.openTime || "-"}</p>
                      {lead.openTimeDetail ? (
                        <p className="mt-2 text-xs leading-5 text-slate-500">{lead.openTimeDetail}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-[1.25rem] border border-white/80 bg-white/70 px-4 py-4 shadow-sm">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">覆盖率</p>
            <div className="mt-4 space-y-4">
              {[
                ["电话", phoneRate],
                ["网站", websiteRate],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{label}</span>
                    <strong className="text-slate-900">{value}%</strong>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#4f46e5,#06b6d4)]"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.25rem] border border-white/80 bg-white/70 px-4 py-4 shadow-sm">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">区域分布</p>
            <div className="mt-4 space-y-3">
              {breakdown.length === 0 ? (
                <p className="text-sm text-slate-500">暂无可展示的区域分布。</p>
              ) : null}

              {breakdown.map(([district, count]) => (
                <div className="rounded-2xl bg-indigo-50/70 px-3 py-3" key={district}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-800">{district}</span>
                    <strong className="text-sm text-indigo-700">{count}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
