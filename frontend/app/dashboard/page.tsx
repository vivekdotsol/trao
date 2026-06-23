"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Trip } from "@/types";

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (!authLoading && user) {
      api.trips
        .list()
        .then(setTrips)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this trip?")) return;
    setDeleting(id);
    try {
      await api.trips.delete(id);
      setTrips((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="page-center">
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
        }}
      >
        <span style={{ fontWeight: 700, color: "var(--accent)", fontSize: 16 }}>
          Trip Planner
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "var(--text-muted)", fontSize: 14 }}>{user?.name}</span>
          <button className="btn-ghost" onClick={logout} style={{ padding: "6px 14px" }}>
            Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Your trips</h1>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
              {trips.length} {trips.length === 1 ? "trip" : "trips"} planned
            </p>
          </div>
          <Link href="/trips/new">
            <button className="btn-primary">Plan a trip</button>
          </Link>
        </div>

        {trips.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: "center", padding: "60px 24px" }}
          >
            <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              No trips yet. Start planning your first destination.
            </p>
            <Link href="/trips/new">
              <button className="btn-primary">Plan a trip</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {trips.map((trip) => (
              <div
                key={trip._id}
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 24px",
                  cursor: "pointer",
                }}
                onClick={() => router.push(`/trips/${trip._id}`)}
              >
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                    {trip.destination}
                  </h2>
                  <div style={{ display: "flex", gap: 16, color: "var(--text-muted)", fontSize: 13 }}>
                    <span>{trip.days} {trip.days === 1 ? "day" : "days"}</span>
                    <span style={{ textTransform: "capitalize" }}>{trip.budgetType} budget</span>
                    {trip.interests.length > 0 && (
                      <span>{trip.interests.slice(0, 3).join(", ")}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
                  <Link href={`/trips/${trip._id}`}>
                    <button className="btn-ghost" style={{ padding: "6px 14px", fontSize: 13 }}>
                      View
                    </button>
                  </Link>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(trip._id)}
                    disabled={deleting === trip._id}
                  >
                    {deleting === trip._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
