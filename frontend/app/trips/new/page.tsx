"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

const INTEREST_OPTIONS = [
  "Culture",
  "Food",
  "Nature",
  "Adventure",
  "History",
  "Art",
  "Nightlife",
  "Shopping",
  "Architecture",
  "Beaches",
];

export default function NewTripPage() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(3);
  const [budgetType, setBudgetType] = useState("moderate");
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    setError("");
    setLoading(true);
    try {
      const trip = await api.trips.generate({ destination, days, budgetType, interests });
      router.push(`/trips/${trip._id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate trip");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          height: 56,
          gap: 16,
        }}
      >
        <Link href="/dashboard" style={{ color: "var(--text-muted)", fontSize: 14 }}>
          &larr; Dashboard
        </Link>
        <span style={{ color: "var(--border)" }}>|</span>
        <span style={{ fontWeight: 600, fontSize: 15 }}>Plan a trip</span>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Where are you going?</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 32 }}>
          Fill in the details and an AI will build your itinerary.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label className="label">Destination</label>
            <input
              type="text"
              placeholder="e.g. Tokyo, Japan"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">Duration</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                style={{ maxWidth: 100 }}
              />
              <span style={{ color: "var(--text-muted)", fontSize: 14 }}>days</span>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">Budget</label>
            <select value={budgetType} onChange={(e) => setBudgetType(e.target.value)}>
              <option value="budget">Budget</option>
              <option value="moderate">Moderate</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>

          <div style={{ marginBottom: 32 }}>
            <label className="label">Interests (optional)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {INTEREST_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleInterest(item)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 20,
                    fontSize: 13,
                    border: `1px solid ${interests.includes(item) ? "var(--accent)" : "var(--border)"}`,
                    background: interests.includes(item) ? "rgba(200,169,126,0.15)" : "transparent",
                    color: interests.includes(item) ? "var(--accent)" : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="error-msg" style={{ marginBottom: 16 }}>{error}</p>}

          {loading && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "16px 20px",
                marginBottom: 20,
                color: "var(--text-muted)",
                fontSize: 14,
              }}
            >
              Generating your itinerary for {destination}... This takes a moment.
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Generating..." : "Generate itinerary"}
            </button>
            <Link href="/dashboard">
              <button className="btn-ghost" type="button">
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
