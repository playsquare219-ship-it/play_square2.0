'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Booking {
  id: string;
  stadiumName: string;
  date: string;
  time: string;
  wilaya: string;
  commune: string;
  createdAt: string;
  status: string;
}

const R = "#E8003D", BG = "#0D0D0D", CB = "#1A1A1A", BD = "#2A2A2A", MU = "#888";

const styles = {
  page: {
    background: BG,
    minHeight: "100vh",
    maxWidth: 430,
    margin: "0 auto",
    color: "#fff",
    display: "flex",
    flexDirection: "column" as const,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 18px 14px",
    borderBottom: `1px solid ${BD}`,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
  },
  headerSub: {
    fontSize: 12,
    color: MU,
  },
  scroll: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "16px 18px",
  },
  bookingCard: {
    background: CB,
    border: `1px solid ${BD}`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    marginBottom: 12,
  },
  stadiumName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#fff",
  },
  statusBadge: {
    background: "#0a1f0d",
    border: `1px solid #1a5a20`,
    borderRadius: 20,
    padding: "4px 10px",
    fontSize: 11,
    fontWeight: 700,
    color: "#4ade80",
  },
  cardMeta: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    color: MU,
  },
  metaLabel: {
    width: 60,
    fontWeight: 600,
  },
  metaValue: {
    color: "#fff",
    flex: 1,
  },
  empty: {
    textAlign: "center" as const,
    padding: "60px 20px",
    color: MU,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    marginBottom: 20,
  },
  backBtn: {
    background: CB,
    border: `1px solid ${BD}`,
    borderRadius: 10,
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#fff",
    padding: 0,
  },
  redBtn: {
    background: R,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 24px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

const ChevronLeft = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      try {
        // Try to fetch from Firebase API first
        const soloRes = await fetch('/api/bookings/all');
        const teamRes = await fetch('/api/booking-matches');
        
        let allBookings: Booking[] = [];
        
        // Get solo bookings from Firebase
        if (soloRes.ok) {
          const data = await soloRes.json();
          allBookings.push(...(data.bookings || []));
        }
        
        // Get team bookings from Firebase
        if (teamRes.ok) {
          const data = await teamRes.json();
          const teamBookings = (data.bookings || []).map((b: any) => ({
            ...b,
            isTeamBooking: true,
          }));
          allBookings.push(...teamBookings);
        }

        // Also get local bookings from localStorage (solo and team)
        if (typeof window !== 'undefined') {
          const soloStored = localStorage.getItem('ps_bookings');
          if (soloStored) {
            const soloBookings = JSON.parse(soloStored);
            for (const booking of soloBookings) {
              if (!allBookings.some(b => b.date === booking.date && b.time === booking.time && b.stadiumName === booking.stadiumName)) {
                allBookings.push(booking);
              }
            }
          }
          
          const teamStored = localStorage.getItem('ps_team_bookings');
          if (teamStored) {
            const teamBookings = JSON.parse(teamStored);
            for (const booking of teamBookings) {
              if (!allBookings.some(b => b.requestId === booking.requestId && b.date === booking.date)) {
                allBookings.push({...booking, isTeamBooking: true});
              }
            }
          }
        }
        
        // Sort by date (newest first)
        allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setBookings(allBookings);
      } catch (error) {
        console.error('[v0] Error loading bookings:', error);
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          const soloStored = localStorage.getItem('ps_bookings');
          const teamStored = localStorage.getItem('ps_team_bookings');
          let allBookings: Booking[] = [];
          
          if (soloStored) {
            allBookings.push(...JSON.parse(soloStored));
          }
          if (teamStored) {
            const teamBookings = JSON.parse(teamStored);
            allBookings.push(...teamBookings.map((b: any) => ({...b, isTeamBooking: true})));
          }
          
          allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setBookings(allBookings);
        }
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.back()}>
          <ChevronLeft />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={styles.headerTitle}>My Bookings</div>
          <div style={styles.headerSub}>{bookings.length} total bookings</div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={styles.scroll}>
        {loading ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>⏳</div>
            <div style={styles.emptyText}>Loading bookings...</div>
          </div>
        ) : bookings.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>📅</div>
            <div style={styles.emptyText}>No bookings yet</div>
            <button 
              style={styles.redBtn}
              onClick={() => router.push('/bookings')}
            >
              Book a Stadium
            </button>
          </div>
        ) : (
          bookings.map((booking) => (
            <div key={booking.id} style={styles.bookingCard}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.stadiumName}>{booking.stadiumName}</div>
                  <div style={{ fontSize: 12, color: MU, marginTop: 4 }}>
                    {booking.wilaya} · {booking.commune}
                  </div>
                </div>
                <div style={styles.statusBadge}>{booking.status}</div>
              </div>

              <div style={styles.cardMeta}>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>📅 Date</span>
                  <span style={styles.metaValue}>{formatDate(booking.date)}</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>⏰ Time</span>
                  <span style={styles.metaValue}>{booking.time}</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>📋 Booked</span>
                  <span style={styles.metaValue}>
                    {new Date(booking.createdAt).toLocaleDateString('en-US')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}
