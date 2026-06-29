'use client';

import { useState, useMemo } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Stadium {
  id: number;
  name: string;
  wilayaId: number;
  wilaya: string;
  commune: string;
  image: string;
  type: string;
  capacity: number;
}

interface Booking {
  id?: string;
  stadiumId: number;
  stadiumName: string;
  date: string;
  time: string;
  userId?: string;
  createdAt?: string;
}

interface Wilaya {
  id: number;
  name: string;
  communes: string[];
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const R = "#E8003D", BG = "#0D0D0D", CB = "#1A1A1A", BD = "#2A2A2A", MU = "#888";
const S = {
  page:        { background: BG, minHeight: "100vh", maxWidth: 430, margin: "0 auto", color: "#fff", direction: "ltr", display: "flex", flexDirection: "column" },
  header:      { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 18px 14px", borderBottom: `1px solid ${BD}` },
  headerTitle: { fontSize: 20, fontWeight: 700, textAlign: "left" },
  headerSub:   { fontSize: 12, color: MU, textAlign: "left" },
  logoWrap:    { width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: CB, display: "flex", alignItems: "center", justifyContent: "center" },
  backBtn:     { background: CB, border: `1px solid ${BD}`, borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" },
  searchWrap:  { position: "relative" },
  searchIco:   { position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: MU, display: "flex" },
  searchInput: { width: "100%", background: CB, border: `1px solid ${BD}`, borderRadius: 12, padding: "12px 14px 12px 40px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", direction: "ltr" },
  filterToggle: { width: 46, height: 46, flexShrink: 0, background: CB, border: `1px solid ${BD}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: MU, position: "relative" },
  filterToggleActive: { border: `1.5px solid ${R}`, color: R, background: "#1f0808" },
  filterBadge: { position: "absolute", top: -6, left: -6, background: R, color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 20, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" },
  filterPanel: { background: CB, border: `1px solid ${BD}`, borderRadius: 16, padding: "16px", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" },
  filterPanelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  filterCloseBtn: { background: "#2a2a2a", border: `1px solid ${BD}`, borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: MU },
  filterRow:   { marginBottom: 12 },
  filterLabel: { fontSize: 12, color: MU, marginBottom: 6, fontWeight: 600 },
  selectBtn:   { width: "100%", background: "#111", border: `1px solid ${BD}`, borderRadius: 11, padding: "11px 12px", color: "#fff", fontSize: 13, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" },
  selectActive: { border: `1px solid ${R}`, color: "#fff" },
  selectDisabled: { opacity: 0.4, cursor: "not-allowed" },
  selectBackdrop: { position: "fixed", inset: 0, zIndex: 10 },
  selectDropdown: { position: "absolute", top: "calc(100% + 4px)", right: 0, left: 0, background: "#1e1e1e", border: `1px solid ${BD}`, borderRadius: 12, zIndex: 20, maxHeight: 200, overflowY: "auto" as const, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" },
  selectOption: { padding: "11px 14px", fontSize: 13, cursor: "pointer", borderBottom: `1px solid #222`, textAlign: "left" },
  selectOptionActive: { background: "#1f0808", color: R, fontWeight: 700 },
  chip:        { display: "flex", alignItems: "center", gap: 5, background: "#1f0808", border: `1px solid #5a1010`, borderRadius: 20, padding: "5px 10px", color: "#ff9999" },
  chipX:       { background: "none", border: "none", cursor: "pointer", color: "#ff6666", display: "flex", padding: 0 },
  clearAll:    { background: "none", border: `1px solid ${BD}`, borderRadius: 20, padding: "5px 12px", color: MU, fontSize: 12, cursor: "pointer", fontFamily: "inherit" },
  listLabel:   { display: "flex", alignItems: "center", gap: 8, padding: "0 18px 10px", fontSize: 16, fontWeight: 700 },
  countBadge:  { background: R, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "1px 8px" },
  scroll:      { flex: 1, overflowY: "auto" as const, padding: "0 18px" },
  card:        { background: CB, borderRadius: 16, border: `1px solid ${BD}`, marginBottom: 14, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" },
  cardImg:     { width: "100%", height: "100%", objectFit: "cover" as const, display: "block" },
  cardShade:   { position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.75))" },
  badge:       { position: "absolute", top: 10, left: 10, background: R, color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "3px 10px" },
  cardWilaya:  { position: "absolute", bottom: 10, left: 10, display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.8)", background: "rgba(0,0,0,0.5)", borderRadius: 20, padding: "3px 8px" },
  cardBody:    { padding: "13px 16px" },
  cardName:    { fontSize: 17, fontWeight: 700, marginBottom: 6 },
  cardMeta:    { display: "flex", gap: 14, marginBottom: 12 },
  metaItem:    { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: MU },
  redBtn:      { background: R, color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 16px ${R}44`, letterSpacing: 0.3 },
  btnDisabled: { background: "#333", color: "#666", boxShadow: "none", cursor: "not-allowed" },
  empty:       { textAlign: "center", color: MU, padding: "50px 0", fontSize: 15 },
  banner:      { position: "relative", height: 175, borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  bannerImg:   { width: "100%", height: "100%", objectFit: "cover" as const },
  bannerShade: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)" },
  bannerText:  { position: "absolute", bottom: 14, right: 14 },
  bannerName:  { fontSize: 20, fontWeight: 800, marginBottom: 4 },
  bannerLoc:   { display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "rgba(255,255,255,0.75)" },
  infoPill:    { background: "#1a1a1a", border: `1px solid ${BD}`, borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#ccc" },
  section:     { marginBottom: 20 },
  secLabel:    { fontSize: 14, fontWeight: 600, color: MU, marginBottom: 10 },
  grid:        { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 },
  slot:        { background: CB, border: `1px solid ${BD}`, borderRadius: 10, padding: "10px 4px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  slotTaken:   { background: "#1c0808", border: "1px solid #3a1010", color: "#5a2020", cursor: "not-allowed" },
  slotSel:     { background: R, border: `1px solid ${R}`, color: "#fff", boxShadow: `0 0 14px ${R}55` },
  msg:         { borderRadius: 12, padding: "12px 16px", fontSize: 15, fontWeight: 600, textAlign: "center", marginBottom: 14 },
  msgErr:      { background: "#1f0a0a", border: "1px solid #5a1010", color: "#ff6b6b" },
  msgOk:       { background: "#0a1f0d", border: "1px solid #1a5a20", color: "#4ade80" },
  successBox:  { background: "#0a1f0d", border: "1px solid #1a5a20", borderRadius: 16, padding: "28px 20px", textAlign: "center", marginBottom: 16 },
  successTitle:{ fontSize: 20, fontWeight: 800, color: "#4ade80", marginBottom: 8 },
  successInfo: { fontSize: 13, color: MU, lineHeight: 1.7 },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const LocationIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const ChevronLeft = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);
const UsersIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const FilterIcon = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
const XIcon = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);

// ─── Custom Select ────────────────────────────────────────────────────────────
function CustomSelect({ placeholder, value, options, onChange, disabled }: any) {
  const [open, setOpen] = useState(false);
  const label = options.find((o: any) => o.value === value)?.label;

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <button
        onClick={() => !disabled && setOpen((p) => !p)}
        style={{
          ...S.selectBtn,
          ...(disabled ? S.selectDisabled : {}),
          ...(value ? S.selectActive : {}),
        }}
      >
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label || <span style={{ color: "#555" }}>{placeholder}</span>}
        </span>
        <ChevronDown />
      </button>
      {open && (
        <>
          <div style={S.selectBackdrop} onClick={() => setOpen(false)} />
          <div style={S.selectDropdown}>
            <div
              style={S.selectOption}
              onClick={() => { onChange(""); setOpen(false); }}
            >
              <span style={{ color: "#888" }}>— {placeholder} —</span>
            </div>
            {options.map((o: any) => (
              <div
                key={o.value}
                style={{ ...S.selectOption, ...(value === o.value ? S.selectOptionActive : {}) }}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                {o.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, onRemove }: any) {
  return (
    <div style={S.chip}>
      <LocationIcon />
      <span style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
      <button style={S.chipX} onClick={onRemove}><XIcon /></button>
    </div>
  );
}

// ─── English Date Picker ──────────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function EnglishDatePicker({ value, onChange }: any) {
  const today = new Date(); today.setHours(0,0,0,0);
  const sel   = value ? new Date(value + "T00:00:00") : today;
  const [view, setView] = useState({ year: sel.getFullYear(), month: sel.getMonth() });

  function prevMonth() {
    setView((v: any) => {
      const d = new Date(v.year, v.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }
  function nextMonth() {
    setView((v: any) => {
      const d = new Date(v.year, v.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ background: CB, border: `1px solid ${BD}`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${BD}` }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 6px" }}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>{MONTHS[view.month]} {view.year}</span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 6px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "8px 10px 4px" }}>
        {DAYS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, color: MU, fontWeight: 600, padding: "3px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "0 10px 12px", gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />;
          const cellDate = new Date(view.year, view.month, day);
          cellDate.setHours(0,0,0,0);
          const isPast = cellDate < today;
          // Format the cell date as YYYY-MM-DD for proper comparison
          const y = view.year, m = String(view.month+1).padStart(2,"0"), dd = String(day).padStart(2,"0");
          const formattedCellDate = `${y}-${m}-${dd}`;
          const isSelected = value === formattedCellDate;
          const isToday = cellDate.getTime() === today.getTime();
          return (
            <button
              key={day}
              disabled={isPast}
              onClick={() => {
                onChange(formattedCellDate);
              }}
              style={{
                background: isSelected ? R : isToday ? "#2a0a0a" : "none",
                border: isToday && !isSelected ? `1px solid ${R}` : "1px solid transparent",
                borderRadius: 8,
                color: isPast ? "#444" : "#fff",
                cursor: isPast ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: isSelected ? 700 : 400,
                padding: "7px 2px",
                textAlign: "center",
                boxShadow: isSelected ? `0 0 10px ${R}66` : "none",
                fontFamily: "inherit",
              }}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stadium Card ─────────────────────────────────────────────────────────────
function StadiumCard({ stadium, onBook }: any) {
  return (
    <div style={S.card}>
      <div style={{ position: "relative", height: 155 }}>
        <img src={stadium.image} alt={stadium.name} style={S.cardImg} />
        <div style={S.cardShade} />
        <span style={S.badge}>{stadium.type}</span>
        <div style={S.cardWilaya}>
          <LocationIcon /> {stadium.wilaya}
        </div>
      </div>
      <div style={S.cardBody}>
        <div style={S.cardName}>{stadium.name}</div>
        <div style={S.cardMeta}>
          <span style={S.metaItem}><LocationIcon /> {stadium.commune}</span>
          <span style={S.metaItem}><UsersIcon /> {stadium.capacity} players</span>
        </div>
        <button style={{ ...S.redBtn, width: "100%" }} onClick={() => onBook(stadium)}>Book</button>
      </div>
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
function FilterPanel({ wilayaId, communeVal, onWilayaChange, onCommuneChange, onClose, wilayas }: any) {
  const selectedWilaya = wilayas.find((w: any) => w.id === wilayaId);
  const communeOptions = selectedWilaya
    ? selectedWilaya.communes.map((c: string) => ({ value: c, label: c }))
    : [];

  return (
    <div style={S.filterPanel}>
      <div style={S.filterPanelHeader}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>🔍 Filter Stadiums</span>
        <button style={S.filterCloseBtn} onClick={onClose}><XIcon /></button>
      </div>

      <div style={S.filterRow}>
        <div style={S.filterLabel}>🗺️ Wilaya</div>
        <CustomSelect
          placeholder="Select Wilaya"
          value={wilayaId ? String(wilayaId) : ""}
          options={wilayas.map((w: any) => ({ value: String(w.id), label: `${w.id} - ${w.name}` }))}
          onChange={(v: any) => { onWilayaChange(v ? Number(v) : null); onCommuneChange(""); }}
        />
      </div>

      <div style={S.filterRow}>
        <div style={S.filterLabel}>📍 Commune</div>
        <CustomSelect
          placeholder={wilayaId ? "Select Commune" : "Select a Wilaya first"}
          value={communeVal}
          options={communeOptions}
          onChange={onCommuneChange}
          disabled={!wilayaId}
        />
      </div>

      <button style={{ ...S.redBtn, width: "100%", marginTop: 6, padding: "12px" }} onClick={onClose}>
        Apply Filters ✓
      </button>
    </div>
  );
}

// ─── Booking Page ─────────────────────────────────────────────────────────────
function BookingPage({ stadium, onBack }: any) {
  const router = useRouter();
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setTick] = useState(0);
  const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());

  const TIME_SLOTS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"];

  // Load booked slots
  useEffect(() => {
    async function loadBookedSlots() {
      try {
        const res = await fetch(`/api/bookings?stadiumId=${stadium.id}&date=${date}`);
        if (res.ok) {
          const data = await res.json();
          const slotSet = new Set(data.bookedSlots || []);
          setBookedSlots(slotSet);
        }
      } catch (error) {
        console.error('[v0] Error loading booked slots:', error);
      }
    }
    loadBookedSlots();
  }, [stadium.id, date]);

  function isSlotBooked(t: string) {
    return bookedSlots.has(t);
  }

  function handleSlotClick(t: string) {
    if (!isSlotBooked(t)) {
      setTime(t);
      setStatus("available");
    }
  }

  async function handleConfirm() {
    if (!time) return;
    setLoading(true);
    try {
      const isTeamBooking = stadium.isTeamBooking === true;
      const requestId = stadium.requestId;

      if (isTeamBooking && requestId) {
        // Team booking flow - save to booking_matches collection
        const res = await fetch('/api/booking-matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            matchRequestId: requestId,
            stadiumName: stadium.name,
            date,
            time,
            wilaya: stadium.wilaya,
            commune: stadium.commune,
            matchDetails: {
              teamId: stadium.teamId || null,
              bookedAt: new Date().toISOString(),
            },
          }),
        });

        if (res.ok) {
          setStatus("success");
          setTick((n) => n + 1);
          
          // Save to localStorage as backup
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('ps_team_bookings') || '[]';
            const bookings = JSON.parse(stored);
            bookings.push({
              requestId,
              stadiumName: stadium.name,
              date,
              time,
              wilaya: stadium.wilaya,
              commune: stadium.commune,
              createdAt: new Date().toISOString(),
              status: 'confirmed',
              isTeamBooking: true,
            });
            localStorage.setItem('ps_team_bookings', JSON.stringify(bookings));
          }

          // Redirect to my-bookings after 2 seconds
          setTimeout(() => {
            router.push('/my-bookings');
          }, 2000);
        } else {
          setStatus("error");
        }
      } else {
        // Solo booking flow - save to bookings collection
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stadiumId: stadium.id,
            stadiumName: stadium.name,
            date,
            time,
            wilaya: stadium.wilaya,
            commune: stadium.commune,
          }),
        });

        if (res.ok) {
          const booking = await res.json();
          setStatus("success");
          setTick((n) => n + 1);
          
          // Save booking to localStorage
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('ps_bookings') || '[]';
            const bookings = JSON.parse(stored);
            bookings.push({
              id: booking.id,
              stadiumName: stadium.name,
              date,
              time,
              wilaya: stadium.wilaya,
              commune: stadium.commune,
              createdAt: new Date().toISOString(),
              status: 'confirmed',
            });
            localStorage.setItem('ps_bookings', JSON.stringify(bookings));
          }
          
          // Redirect to my-bookings after 2 seconds
          setTimeout(() => {
            router.push('/my-bookings');
          }, 2000);
        } else {
          setStatus("error");
        }
      }
    } catch (error) {
      console.error('[v0] Booking error:', error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.backBtn} onClick={onBack}><ChevronLeft /></button>
        <div style={{ textAlign: "center" }}>
          <div style={S.headerTitle}>Book Stadium</div>
          <div style={S.headerSub}>{stadium.name}</div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div style={S.scroll}>
        <div style={{ ...S.banner, marginTop: 16 }}>
          <img src={stadium.image} alt={stadium.name} style={S.bannerImg} />
          <div style={S.bannerShade} />
          <div style={S.bannerText}>
            <div style={S.bannerName}>{stadium.name}</div>
            <div style={S.bannerLoc}><LocationIcon /> {stadium.wilaya} · {stadium.commune}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={S.infoPill}>🗺️ {stadium.wilaya}</div>
          <div style={S.infoPill}>📍 {stadium.commune}</div>
          <div style={S.infoPill}>👥 {stadium.capacity} players</div>
        </div>

        <div style={S.section}>
          <div style={S.secLabel}>📅 Select Date</div>
          <EnglishDatePicker value={date} onChange={(d: string) => { setDate(d); setTime(null); setStatus(null); }} />
        </div>

        <div style={S.section}>
          <div style={S.secLabel}>⏰ Select Time</div>
          <div style={S.grid}>
            {TIME_SLOTS.map((t) => {
              const taken = isSlotBooked(t);
              const sel = time === t;
              return (
                <button
                  key={t}
                  disabled={taken}
                  onClick={() => !taken && handleSlotClick(t)}
                  style={{ ...S.slot, ...(taken ? S.slotTaken : sel ? S.slotSel : {}) }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {status === "error" && <div style={{ ...S.msg, ...S.msgErr }}>Booking failed. Please try again ❌</div>}
        {status === "available" && <div style={{ ...S.msg, ...S.msgOk }}>Slot is available ✅</div>}

        {status === "success" && (
          <div style={S.successBox}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
            <div style={S.successTitle}>Booking Confirmed!</div>
            <div style={S.successInfo}>{stadium.name}</div>
            <div style={S.successInfo}>{stadium.wilaya} · {stadium.commune}</div>
            <div style={{ ...S.successInfo, marginTop: 4 }}>{date} · {time}</div>
            <button style={{ ...S.redBtn, marginTop: 20 }} onClick={onBack}>Back to Stadiums</button>
          </div>
        )}

        {status !== "success" && (
          <button
            style={{
              ...S.redBtn,
              width: "100%",
              marginTop: 8,
              fontSize: 16,
              padding: "15px",
              ...(!time || loading ? S.btnDisabled : {}),
            }}
            disabled={!time || loading}
            onClick={handleConfirm}
          >
            {loading ? "Booking..." : "Confirm Booking"}
          </button>
        )}
        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function BookingsPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Stadium | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [wilayaId, setWilayaId] = useState<number | null>(null);
  const [commune, setCommune] = useState("");
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize with URL parameters if coming from matches/create or notifications
  useEffect(() => {
    const stadiumName = searchParams.get('stadium');
    const wilayaFromUrl = searchParams.get('wilaya');
    const communeFromUrl = searchParams.get('commune');
    const dateFromUrl = searchParams.get('date');
    const timeFromUrl = searchParams.get('time');
    const isTeamBooking = searchParams.get('isTeamBooking') === 'true';
    const requestId = searchParams.get('requestId');

    if (stadiumName) {
      // Auto-select stadium if passed via URL
      const stadium: Stadium = {
        id: Math.random(),
        name: stadiumName,
        wilayaId: parseInt(wilayaFromUrl || '0') || 0,
        wilaya: wilayaFromUrl || '',
        commune: communeFromUrl || '',
        image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&q=80',
        type: 'Football',
        capacity: 22,
        isTeamBooking: isTeamBooking,
        requestId: requestId || undefined,
      };
      setSelected(stadium);
    }
  }, [searchParams]);

  // Load wilayas on mount
  useEffect(() => {
    async function loadWilayas() {
      try {
        const res = await fetch('/api/wilayas');
        if (res.ok) {
          const data = await res.json();
          // Transform wilayas data to match expected format
          const transformedWilayas = data.wilayas.map((w: any) => ({
            id: w.id || w.wilayaId || parseInt(w.name.split('_')[1]) || Math.random(),
            name: w.name,
            communes: w.communes || [],
          }));
          setWilayas(transformedWilayas);
        }
      } catch (error) {
        console.error('[v0] Error loading wilayas:', error);
      }
    }
    loadWilayas();
  }, []);

  // Load stadiums
  useEffect(() => {
    async function loadStadiums() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (wilayaId) params.append('wilayaId', String(wilayaId));
        if (commune) params.append('commune', commune);
        const res = await fetch(`/api/stadiums?${params}`);
        if (res.ok) {
          const data = await res.json();
          // Transform stadiums data to match expected format
          const transformedStadiums = (data.stadiums || []).map((s: any) => ({
            id: Math.random(),
            name: s.name,
            wilayaId: s.wilayaId,
            wilaya: s.wilayaId || 'Unknown',
            commune: s.baladiaId || commune || 'Unknown',
            image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=400&q=80',
            type: 'Football',
            capacity: 22,
          }));
          setStadiums(transformedStadiums);
        }
      } catch (error) {
        console.error('[v0] Error loading stadiums:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStadiums();
  }, [wilayaId, commune]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return stadiums.filter((s) => {
      const matchQuery = !q || s.name.toLowerCase().includes(q) || s.commune.toLowerCase().includes(q) || s.wilaya.toLowerCase().includes(q);
      return matchQuery;
    });
  }, [query, stadiums]);

  const activeFilters = [
    wilayaId && { key: "wilaya", label: wilayas.find((w) => w.id === wilayaId)?.name, remove: () => { setWilayaId(null); setCommune(""); } },
    commune && { key: "commune", label: commune, remove: () => setCommune("") },
  ].filter(Boolean);

  if (selected) return <BookingPage stadium={selected} onBack={() => setSelected(null)} />;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Play Square</div>
          <div style={S.headerSub}>Book Your Stadium</div>
        </div>
        <div style={S.logoWrap}>
          <span style={{ fontSize: 24 }}>⚽</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, margin: "12px 18px 10px", alignItems: "center" }}>
        <div style={{ ...S.searchWrap, flex: 1, margin: 0 }}>
          <span style={S.searchIco}><SearchIcon /></span>
          <input
            style={S.searchInput}
            placeholder="Search for a stadium..."
            dir="ltr"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilter((p) => !p)}
          style={{ ...S.filterToggle, ...(showFilter || activeFilters.length ? S.filterToggleActive : {}) }}
        >
          <FilterIcon />
          {activeFilters.length > 0 && (
            <span style={S.filterBadge}>{activeFilters.length}</span>
          )}
        </button>
      </div>

      {showFilter && (
        <div style={{ padding: "0 18px 10px" }}>
          <FilterPanel
            wilayaId={wilayaId}
            communeVal={commune}
            onWilayaChange={setWilayaId}
            onCommuneChange={setCommune}
            onClose={() => setShowFilter(false)}
            wilayas={wilayas}
          />
        </div>
      )}

      {activeFilters.length > 0 && (
        <div style={{ display: "flex", gap: 8, padding: "0 18px 10px", flexWrap: "wrap" }}>
          {(activeFilters as any[]).map((f) => (
            <FilterChip key={f.key} label={f.label} onRemove={f.remove} />
          ))}
          <button style={S.clearAll} onClick={() => { setWilayaId(null); setCommune(""); }}>
            Clear All
          </button>
        </div>
      )}

      <div style={S.listLabel}>
        Available Stadiums
        <span style={S.countBadge}>{filtered.length}</span>
      </div>

      <div style={S.scroll}>
        {loading ? (
          <div style={S.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div>Loading stadiums...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div>No stadiums found</div>
            <button
              style={{ ...S.redBtn, marginTop: 14, fontSize: 13, padding: "10px 20px" }}
              onClick={() => { setWilayaId(null); setCommune(""); setQuery(""); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filtered.map((s) => <StadiumCard key={s.id} stadium={s} onBook={setSelected} />)
        )}
        <div style={{ height: 30 }} />
      </div>
    </div>
  );
}
