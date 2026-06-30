'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  totalBookings: number;
  thisMonth: number;
  thisWeek: number;
  upcomingBookings: number;
  favoriteStadium: string;
  mostUsedWilaya: string;
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
    paddingBottom: 80,
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
  statCard: {
    background: CB,
    border: `1px solid ${BD}`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: MU,
    fontWeight: 600,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 800,
    color: R,
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 12,
  },
  smallStatCard: {
    background: CB,
    border: `1px solid ${BD}`,
    borderRadius: 12,
    padding: 14,
  },
  smallStatLabel: {
    fontSize: 11,
    color: MU,
    fontWeight: 600,
    marginBottom: 6,
  },
  smallStatValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#fff",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: MU,
    marginBottom: 12,
  },
  infoRow: {
    background: CB,
    border: `1px solid ${BD}`,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13,
    color: "#fff",
    fontWeight: 600,
  },
  infoValue: {
    fontSize: 13,
    color: R,
    fontWeight: 700,
  },
};

const ChevronLeft = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

export default function StatisticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('ps_bookings');
          const bookings = stored ? JSON.parse(stored) : [];

          const now = new Date();
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const thisWeek = new Date(now);
          thisWeek.setDate(now.getDate() - now.getDay());

          const thisMonthCount = bookings.filter((b: any) => {
            const bookDate = new Date(b.date + 'T00:00:00');
            return bookDate >= thisMonth;
          }).length;

          const thisWeekCount = bookings.filter((b: any) => {
            const bookDate = new Date(b.date + 'T00:00:00');
            return bookDate >= thisWeek;
          }).length;

          const upcomingCount = bookings.filter((b: any) => {
            const bookDate = new Date(b.date + 'T00:00:00');
            return bookDate > now;
          }).length;

          const stadiumCounts: Record<string, number> = {};
          const wilayaCounts: Record<string, number> = {};

          bookings.forEach((b: any) => {
            stadiumCounts[b.stadiumName] = (stadiumCounts[b.stadiumName] || 0) + 1;
            wilayaCounts[b.wilaya] = (wilayaCounts[b.wilaya] || 0) + 1;
          });

          const favoriteStadium = Object.entries(stadiumCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
          const mostUsedWilaya = Object.entries(wilayaCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

          setStats({
            totalBookings: bookings.length,
            thisMonth: thisMonthCount,
            thisWeek: thisWeekCount,
            upcomingBookings: upcomingCount,
            favoriteStadium,
            mostUsedWilaya,
          });
        }
      } catch (error) {
        console.error('[v0] Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => router.back()}>
            <ChevronLeft />
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={styles.headerTitle}>Statistics</div>
          </div>
          <div style={{ width: 36 }} />
        </div>
        <div style={styles.scroll}>
          <div style={{ textAlign: "center", padding: "50px 20px", color: MU }}>
            Loading statistics...
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => router.back()}>
            <ChevronLeft />
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={styles.headerTitle}>Statistics</div>
          </div>
          <div style={{ width: 36 }} />
        </div>
        <div style={styles.scroll}>
          <div style={{ textAlign: "center", padding: "50px 20px", color: MU }}>
            No statistics available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => router.back()}>
          <ChevronLeft />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={styles.headerTitle}>Statistics</div>
          <div style={styles.headerSub}>Your booking activity</div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={styles.scroll}>
        {/* Main Stats */}
        <div style={styles.section}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Bookings</div>
            <div style={styles.statValue}>{stats.totalBookings}</div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={styles.gridContainer}>
          <div style={styles.smallStatCard}>
            <div style={styles.smallStatLabel}>This Week</div>
            <div style={styles.smallStatValue}>{stats.thisWeek}</div>
          </div>
          <div style={styles.smallStatCard}>
            <div style={styles.smallStatLabel}>This Month</div>
            <div style={styles.smallStatValue}>{stats.thisMonth}</div>
          </div>
        </div>

        <div style={styles.gridContainer}>
          <div style={styles.smallStatCard}>
            <div style={styles.smallStatLabel}>Upcoming</div>
            <div style={styles.smallStatValue}>{stats.upcomingBookings}</div>
          </div>
          <div style={styles.smallStatCard}>
            <div style={styles.smallStatLabel}>Past Bookings</div>
            <div style={styles.smallStatValue}>{stats.totalBookings - stats.upcomingBookings}</div>
          </div>
        </div>

        {/* Favorites Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🏟️ Your Favorites</div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Most Used Stadium</span>
            <span style={styles.infoValue}>{stats.favoriteStadium}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Most Used Wilaya</span>
            <span style={styles.infoValue}>{stats.mostUsedWilaya}</span>
          </div>
        </div>

        {/* Tips Section */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>💡 Tips</div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Book in advance for better slots</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Peak hours: 17:00 - 21:00</span>
          </div>
        </div>

        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}
