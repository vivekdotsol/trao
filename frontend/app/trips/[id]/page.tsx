"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Trip, DayItinerary } from "@/types";

export default function TripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(1);
  const [regenerating, setRegenerating] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState("");
  const [showRegenForm, setShowRegenForm] = useState(false);
  const [regenError, setRegenError] = useState("");

  useEffect(() => {
    api.trips
      .get(id)
      .then(setTrip)
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleRegenerate = async () => {
    if (!trip) return;
    setRegenError("");
    setRegenerating(true);
    try {
      const updated = await api.trips.regenerateDay(trip._id, {
        day: activeDay,
        instruction: regenInstruction,
      });
      setTrip(updated);
      setShowRegenForm(false);
      setRegenInstruction("");
    } catch (err: unknown) {
      setRegenError(err instanceof Error ? err.message : "Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-center">
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  if (!trip) return null;

  const currentDay: DayItinerary | undefined = trip.itinerary?.find(
    (d) => d.day === activeDay
  );

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
        <span style={{ fontWeight: 600, fontSize: 15 }}>{trip.destination}</span>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            {trip.destination}
          </h1>
          <div style={{ display: "flex", gap: 20, color: "var(--text-muted)", fontSize: 13 }}>
            <span>{trip.days} {trip.days === 1 ? "day" : "days"}</span>
            <span style={{ textTransform: "capitalize" }}>{trip.budgetType} budget</span>
            {trip.interests.length > 0 && <span>{trip.interests.join(", ")}</span>}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 36 }}>
          {trip.budgetEstimate && (
            <div className="card">
              <h2
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                  marginBottom: 16,
                }}
              >
                Budget estimate
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(["flights", "accommodation", "food", "activities"] as const).map((key) => (
                  trip.budgetEstimate[key] && (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: 13, textTransform: "capitalize" }}>
                        {key}
                      </span>
                      <span style={{ fontSize: 13 }}>{trip.budgetEstimate[key]}</span>
                    </div>
                  )
                ))}
                {trip.budgetEstimate.total && (
                  <>
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>Total</span>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--accent)" }}>
                        {trip.budgetEstimate.total}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {trip.hotels && trip.hotels.length > 0 && (
            <div className="card">
              <h2
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                  marginBottom: 16,
                }}
              >
                Suggested hotels
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {trip.hotels.map((hotel, i) => (
                  <div key={i} style={{ fontSize: 14, padding: "6px 0", borderBottom: i < trip.hotels.length - 1 ? "1px solid var(--border)" : "none" }}>
                    {hotel}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {trip.itinerary && trip.itinerary.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Itinerary</h2>
              <button
                className="btn-ghost"
                style={{ fontSize: 13, padding: "6px 14px" }}
                onClick={() => {
                  setShowRegenForm(!showRegenForm);
                  setRegenError("");
                }}
              >
                {showRegenForm ? "Cancel" : "Modify day"}
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
              {trip.itinerary.map((d) => (
                <button
                  key={d.day}
                  onClick={() => setActiveDay(d.day)}
                  style={{
                    padding: "6px 16px",
                    borderRadius: 6,
                    fontSize: 13,
                    border: `1px solid ${activeDay === d.day ? "var(--accent)" : "var(--border)"}`,
                    background: activeDay === d.day ? "rgba(200,169,126,0.15)" : "transparent",
                    color: activeDay === d.day ? "var(--accent)" : "var(--text-muted)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  Day {d.day}
                </button>
              ))}
            </div>

            {showRegenForm && (
              <div
                className="card"
                style={{ marginBottom: 20, borderColor: "var(--accent-dim)" }}
              >
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                  Describe what you want changed for Day {activeDay}:
                </p>
                <textarea
                  rows={3}
                  placeholder="e.g. Focus on outdoor activities and skip museums"
                  value={regenInstruction}
                  onChange={(e) => setRegenInstruction(e.target.value)}
                  style={{ marginBottom: 12, resize: "vertical" }}
                />
                {regenError && <p className="error-msg" style={{ marginBottom: 12 }}>{regenError}</p>}
                <button
                  className="btn-primary"
                  onClick={handleRegenerate}
                  disabled={regenerating || !regenInstruction.trim()}
                >
                  {regenerating ? "Regenerating..." : "Regenerate day"}
                </button>
              </div>
            )}

            {currentDay && (
              <div className="card">
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 20,
                    color: "var(--accent)",
                  }}
                >
                  Day {currentDay.day}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {currentDay.activities?.map((activity, i) => (
                    <div
                      key={i}
                      style={{
                        paddingLeft: 16,
                        borderLeft: "2px solid var(--border)",
                        paddingBottom: i < currentDay.activities.length - 1 ? 16 : 0,
                      }}
                    >
                      {activity.time && (
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: "var(--accent)",
                            marginBottom: 4,
                          }}
                        >
                          {activity.time}
                        </div>
                      )}
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                        {activity.activity}
                      </div>
                      {activity.description && (
                        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                          {activity.description}
                        </div>
                      )}
                      {activity.cost && (
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                          {activity.cost}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
