"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CREDIT_SCORES = [
  { label: "Excellent (750+)", value: "excellent" },
  { label: "Good (700–749)", value: "good" },
  { label: "Fair (650–699)", value: "fair" },
  { label: "Building (<650)", value: "building" },
];

const PREFERENCES = ["Cash back", "Travel points", "Airline miles", "Hotel points", "No annual fee"];

const CATEGORIES = [
  { key: "dining", label: "Dining" },
  { key: "groceries", label: "Groceries" },
  { key: "gas", label: "Gas" },
  { key: "travel", label: "Travel" },
  { key: "shopping", label: "Online shopping" },
  { key: "streaming", label: "Streaming" },
  { key: "utilities", label: "Utilities" },
  { key: "other", label: "Other" },
];

type Spending = Record<string, string>;

interface CardResult {
  name: string;
  annualFee: number;
  estimatedAnnualRewards: number;
  netValue: number;
  rewardsByCategory: Record<string, number>;
  bestFeature: string;
  signupBonus: string;
  whyThisCard: string;
}

interface OptimizeResult {
  topCards: CardResult[];
  cardsToAvoid: { name: string; reason: string }[];
  totalSpend: number;
}

export default function RewardsOptimizer() {
  const [spending, setSpending] = useState<Spending>({});
  const [creditScore, setCreditScore] = useState("excellent");
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(["Cash back"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResult | null>(null);
  const [error, setError] = useState("");

  function togglePref(p: string) {
    setSelectedPrefs((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  async function optimize() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spending, creditScore, preferences: selectedPrefs }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const totalMonthly = Object.values(spending).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">Rewards Optimizer</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Rewards Optimizer</h1>
          <p className="text-gray-500 mt-1">Enter your monthly spending. Find the card that pays you the most back.</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Monthly spending by category ($)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CATEGORIES.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                      placeholder="0"
                      value={spending[key] || ""}
                      onChange={(e) => setSpending((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              {totalMonthly > 0 && (
                <p className="text-xs text-gray-400 mt-2">Total monthly spend: <span className="font-medium text-gray-600">${totalMonthly.toFixed(0)}</span> · Annual: <span className="font-medium text-gray-600">${(totalMonthly * 12).toFixed(0)}</span></p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Credit score</label>
              <div className="flex flex-wrap gap-2">
                {CREDIT_SCORES.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => setCreditScore(value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${creditScore === value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reward preferences</label>
              <div className="flex flex-wrap gap-2">
                {PREFERENCES.map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePref(p)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selectedPrefs.includes(p) ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={optimize} disabled={loading || totalMonthly === 0}>
                {loading ? "Finding best card..." : "Find my best card"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 mb-6 text-sm">{error}</div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Crunching the numbers...
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <div className="space-y-4">
              {result.topCards.map((card, i) => (
                <Card key={i} className={i === 0 ? "border-gray-400" : ""}>
                  <CardContent className="pt-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {i === 0 && <Badge className="bg-gray-900 text-white text-xs">Best match</Badge>}
                          <h3 className="text-base font-semibold text-gray-900">{card.name}</h3>
                        </div>
                        <p className="text-xs text-gray-500">{card.signupBonus}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">${card.netValue.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">net annual value</p>
                        {card.annualFee > 0 && (
                          <p className="text-xs text-gray-400">${card.estimatedAnnualRewards} rewards − ${card.annualFee} fee</p>
                        )}
                      </div>
                    </div>

                    {/* Rewards bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Rewards by category</span>
                        <span>${card.estimatedAnnualRewards}/year</span>
                      </div>
                      <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                        {Object.entries(card.rewardsByCategory)
                          .filter(([, v]) => v > 0)
                          .sort(([, a], [, b]) => b - a)
                          .map(([cat, val], j) => {
                            const pct = (val / card.estimatedAnnualRewards) * 100;
                            const colors = ["bg-gray-900", "bg-gray-600", "bg-gray-400", "bg-gray-300"];
                            return (
                              <div
                                key={cat}
                                className={`${colors[j % colors.length]} h-full`}
                                style={{ width: `${pct}%` }}
                                title={`${cat}: $${val}`}
                              />
                            );
                          })}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                        {Object.entries(card.rewardsByCategory)
                          .filter(([, v]) => v > 0)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 4)
                          .map(([cat, val]) => (
                            <span key={cat} className="text-xs text-gray-500">{cat}: <span className="text-gray-700 font-medium">${val}</span></span>
                          ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-md px-3 py-2">
                        <p className="text-xs text-gray-400 mb-0.5">Best feature</p>
                        <p className="text-gray-700">{card.bestFeature}</p>
                      </div>
                      <div className="bg-gray-50 rounded-md px-3 py-2">
                        <p className="text-xs text-gray-400 mb-0.5">Why this card for you</p>
                        <p className="text-gray-700">{card.whyThisCard}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {result.cardsToAvoid.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-gray-900">Cards to avoid for your profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.cardsToAvoid.map((c, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                        <span><span className="font-medium">{c.name}</span> — {c.reason}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
