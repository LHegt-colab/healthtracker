import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { Printer, X } from 'lucide-react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  ReferenceLine, Legend, ResponsiveContainer,
} from 'recharts'

// ── Helpers ───────────────────────────────────────────────────────

function bpLabel(sys, dia) {
  if (sys < 120 && dia < 80) return 'Optimaal'
  if (sys < 130 && dia < 85) return 'Normaal'
  if (sys < 140 && dia < 90) return 'Hoog-normaal'
  if (sys < 160 && dia < 100) return 'Graad 1'
  if (sys < 180 && dia < 110) return 'Graad 2'
  return 'Graad 3'
}

const cell = { padding: '1.5mm 3mm', borderBottom: '0.3mm solid #ddd' }
const head = { background: '#1b3a6b', color: 'white', padding: '2mm 3mm', textAlign: 'left', fontWeight: 600 }

function PrintTable({ headers, rows }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5mm', fontSize: '9pt' }}>
      <thead>
        <tr>{headers.map(h => <th key={h} style={head}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 1 ? '#f5f7fb' : 'white' }}>
            {row.map((c, j) => <td key={j} style={cell}>{c ?? '—'}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function StatBox({ value, label }) {
  return (
    <div style={{
      border: '0.3mm solid #1b3a6b', borderRadius: '2mm',
      padding: '2.5mm 5mm', minWidth: '32mm', textAlign: 'center',
    }}>
      <span style={{ display: 'block', fontSize: '14pt', fontWeight: 700, color: '#1b3a6b', lineHeight: 1.2 }}>{value}</span>
      <span style={{ fontSize: '7.5pt', color: '#666' }}>{label}</span>
    </div>
  )
}

function PatientBox({ profile }) {
  const fields = [
    { label: 'Naam patiënt', value: profile?.naam },
    { label: 'Geboortedatum', value: profile?.geboortedatum
      ? (() => { try { return format(new Date(profile.geboortedatum), 'd MMMM yyyy', { locale: nl }) } catch { return profile.geboortedatum } })()
      : '' },
    { label: 'Huisarts / zorgverlener', value: profile?.huisarts },
    { label: 'BSN / Patiëntnummer', value: profile?.bsn },
  ]

  return (
    <div style={{
      border: '0.3mm solid #ccc', borderRadius: '2mm', padding: '3mm 4mm',
      marginBottom: '5mm', display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: '2mm 8mm', fontSize: '9pt',
    }}>
      {fields.map(({ label, value }) => (
        <div key={label} style={{ borderBottom: '0.3mm solid #ccc', paddingBottom: '2mm' }}>
          <span style={{ display: 'block', fontSize: '7.5pt', color: '#888' }}>{label}</span>
          <span style={{ display: 'block', minHeight: '5mm', fontWeight: value ? 500 : 400, color: value ? '#000' : '#ccc' }}>
            {value || '(invullen)'}
          </span>
        </div>
      ))}
    </div>
  )
}

function Meta({ period, count, printDate }) {
  const periodStr = period == null ? null
    : typeof period === 'number'
      ? (period === 0 ? 'alle metingen' : `laatste ${period} dagen`)
      : period
  return (
    <div style={{ display: 'flex', gap: '8mm', marginBottom: '4mm', fontSize: '9pt', color: '#555', flexWrap: 'wrap' }}>
      {periodStr && <span>Periode: {periodStr}</span>}
      {count != null && <span>Aantal records: {count}</span>}
      <span>Rapport gemaakt: {printDate}</span>
    </div>
  )
}

function PrintFooter({ printDate }) {
  return (
    <div style={{
      marginTop: '10mm', paddingTop: '3mm', borderTop: '0.3mm solid #ccc',
      display: 'flex', justifyContent: 'space-between', fontSize: '8pt', color: '#888',
    }}>
      <span>Gezondheidsportaal – Persoonlijk rapport</span>
      <span>Afgedrukt op: {printDate}</span>
    </div>
  )
}

function H1({ children }) {
  return (
    <h1 style={{
      fontSize: '18pt', fontWeight: 700, color: '#1b3a6b',
      marginTop: 0, marginBottom: '4mm',
      borderBottom: '2px solid #1b3a6b', paddingBottom: '3mm',
    }}>{children}</h1>
  )
}

function H2({ children }) {
  return <h2 style={{ fontSize: '13pt', fontWeight: 600, color: '#1b3a6b', margin: '6mm 0 3mm' }}>{children}</h2>
}

// ── Blood pressure content ────────────────────────────────────────

function BloeddrukSection({ entries = [] }) {
  const sorted = [...entries].sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at))
  const ascending = [...entries].sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at))
  const withHR = sorted.filter(e => e.heart_rate)
  const avg = sorted.length ? {
    sys: Math.round(sorted.reduce((s, e) => s + e.systolic, 0) / sorted.length),
    dia: Math.round(sorted.reduce((s, e) => s + e.diastolic, 0) / sorted.length),
    hr: withHR.length ? Math.round(withHR.reduce((s, e) => s + e.heart_rate, 0) / withHR.length) : null,
  } : null

  // Chart data — smart labels (toon tijd als meerdere metingen op dezelfde dag)
  const countByDay = {}
  ascending.forEach(e => {
    const d = e.measured_at.split('T')[0]
    countByDay[d] = (countByDay[d] || 0) + 1
  })
  const chartData = ascending.map(e => {
    const d = e.measured_at.split('T')[0]
    const label = countByDay[d] > 1
      ? format(new Date(e.measured_at), 'd MMM HH:mm', { locale: nl })
      : format(new Date(e.measured_at), 'd MMM', { locale: nl })
    return {
      date: label,
      systolisch: e.systolic,
      diastolisch: e.diastolic,
      hartslag: e.heart_rate ?? null,
    }
  })

  return (
    <>
      {avg && (
        <div style={{ display: 'flex', gap: '4mm', marginBottom: '5mm', flexWrap: 'wrap' }}>
          <StatBox value={`${avg.sys}/${avg.dia}`} label="Gemiddelde bloeddruk (mmHg)" />
          {avg.hr && <StatBox value={avg.hr} label="Gem. hartslag (bpm)" />}
          <StatBox value={sorted.length} label="Metingen totaal" />
          <StatBox value={bpLabel(avg.sys, avg.dia)} label="Gemiddelde categorie" />
        </div>
      )}

      {chartData.length > 0 && (
        <div style={{ width: '100%', height: 210, marginBottom: '5mm' }}>
          <ResponsiveContainer width="100%" height={210}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 7, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 7, fill: '#6b7280' }} domain={['auto', 'auto']} width={28} />
              <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Optimaal', fontSize: 7, fill: '#22c55e', position: 'right' }} />
              <ReferenceLine y={140} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Grens hoog', fontSize: 7, fill: '#f97316', position: 'right' }} />
              <Area type="monotone" dataKey="systolisch" stroke="#1b3a6b" fill="#dbeafe" strokeWidth={1.5} name="Systolisch" dot={{ r: 3, fill: '#1b3a6b' }} />
              <Line type="monotone" dataKey="diastolisch" stroke="#0d9488" strokeWidth={1.5} dot={{ r: 3, fill: '#0d9488' }} name="Diastolisch" />
              {chartData.some(d => d.hartslag) && (
                <Line type="monotone" dataKey="hartslag" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 3, fill: '#ef4444' }} name="Hartslag (bpm)" />
              )}
              <Legend wrapperStyle={{ fontSize: '8pt' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {sorted.length === 0
        ? <p style={{ fontSize: '9pt', color: '#888', margin: '3mm 0' }}>Geen bloeddrukmetingen in deze periode.</p>
        : (
          <PrintTable
            headers={['Datum', 'Tijd', 'Systolisch', 'Diastolisch', 'Hartslag', 'Categorie', 'Opmerkingen']}
            rows={sorted.map(e => [
              format(new Date(e.measured_at.split('T')[0]), 'd MMM yyyy', { locale: nl }),
              e.measured_at.split('T')[1]?.substring(0, 5),
              `${e.systolic} mmHg`,
              `${e.diastolic} mmHg`,
              e.heart_rate ? `${e.heart_rate} bpm` : null,
              bpLabel(e.systolic, e.diastolic),
              e.notes,
            ])}
          />
        )
      }
    </>
  )
}

// ── Stand-alone blood pressure report (from Bloeddruk page) ──────

function BloeddrukContent({ entries = [], period, printDate, profile }) {
  return (
    <>
      <H1>Bloeddruk Rapport</H1>
      <PatientBox profile={profile} />
      <Meta period={period} count={entries.length} printDate={printDate} />
      <H2>Meetwaarden</H2>
      <BloeddrukSection entries={entries} />
      <PrintFooter printDate={printDate} />
    </>
  )
}

// ── General rapport report with category selection ────────────────

function RapportenContent({ rawBpEntries = [], weightData = [], actBySport = [], nutData = [], period, printDate, profile, selectedCategories = ['bloeddruk', 'gewicht', 'activiteiten', 'voeding'] }) {
  const has = (key) => selectedCategories.includes(key)

  const totalSessions = actBySport.reduce((s, a) => s + a.count, 0)
  const totalMin = actBySport.reduce((s, a) => s + a.minuten, 0)
  const totalKcalBurned = actBySport.reduce((s, a) => s + a.kcal, 0)

  // Summary stats for selected categories
  const summaryBoxes = []
  if (has('bloeddruk') && rawBpEntries.length > 0) summaryBoxes.push(<StatBox key="bp" value={rawBpEntries.length} label="Bloeddruk metingen" />)
  if (has('gewicht') && weightData.length > 0) summaryBoxes.push(<StatBox key="w" value={weightData.length} label="Gewichtsmetingen" />)
  if (has('activiteiten') && totalSessions > 0) {
    summaryBoxes.push(<StatBox key="act" value={totalSessions} label="Activiteiten sessies" />)
    summaryBoxes.push(<StatBox key="min" value={totalMin} label="Minuten actief" />)
    if (totalKcalBurned > 0) summaryBoxes.push(<StatBox key="kcal" value={totalKcalBurned.toLocaleString()} label="Kcal verbrand" />)
  }

  return (
    <>
      <H1>Gezondheidsrapport – Overzicht</H1>
      <PatientBox profile={profile} />
      <Meta period={period} printDate={printDate} />

      {summaryBoxes.length > 0 && (
        <div style={{ display: 'flex', gap: '4mm', marginBottom: '6mm', flexWrap: 'wrap' }}>
          {summaryBoxes}
        </div>
      )}

      {/* Bloeddruk */}
      {has('bloeddruk') && (
        <>
          <H2>📊 Bloeddruk metingen</H2>
          <BloeddrukSection entries={rawBpEntries} />
        </>
      )}

      {/* Gewicht */}
      {has('gewicht') && weightData.length > 0 && (
        <>
          <H2>⚖️ Gewicht</H2>
          <PrintTable
            headers={['Datum', 'Gewicht (kg)', 'BMI']}
            rows={weightData.map(d => [d.date, `${d.gewicht} kg`, d.bmi ?? null])}
          />
        </>
      )}

      {/* Activiteiten */}
      {has('activiteiten') && actBySport.length > 0 && (
        <>
          <H2>🏃 Activiteiten per sporttype</H2>
          <PrintTable
            headers={['Sporttype', 'Sessies', 'Totaal minuten', 'Totaal kcal']}
            rows={actBySport.map(s => [s.name, s.count, `${s.minuten} min`, `${s.kcal} kcal`])}
          />
        </>
      )}

      {/* Voeding */}
      {has('voeding') && nutData.length > 0 && (
        <>
          <H2>🥗 Voeding – Dagelijkse inname</H2>
          <PrintTable
            headers={['Datum', 'Calorieën', 'Eiwit (g)', 'Koolhydraten (g)', 'Vetten (g)']}
            rows={nutData.map(d => [d.date, `${d.Calorieën} kcal`, d.Eiwit, d.Koolhydraten, d.Vetten])}
          />
        </>
      )}

      <PrintFooter printDate={printDate} />
    </>
  )
}

// ── Main export ───────────────────────────────────────────────────

export default function PrintReport({ isOpen, onClose, type, title, ...props }) {
  if (!isOpen) return null

  const printDate = format(new Date(), "d MMMM yyyy 'om' HH:mm", { locale: nl })

  return createPortal(
    <div
      className="print-report"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'white', overflow: 'auto',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Toolbar — hidden during print */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#1b3a6b', color: 'white',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)', gap: '12px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '15px' }}>Afdrukvoorbeeld — {title}</div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>
            Klik "Afdrukken" en kies <em>Opslaan als PDF</em> als bestemming
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '6px 14px', borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.35)',
              background: 'transparent', color: 'white', cursor: 'pointer', fontSize: '13px',
            }}
          >
            <X size={14} /> Sluiten
          </button>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 16px', borderRadius: '6px',
              border: 'none', background: '#0d9488', color: 'white',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            }}
          >
            <Printer size={14} /> Afdrukken / PDF
          </button>
        </div>
      </div>

      {/* A4 page preview area */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '24px',
        background: '#94a3b8',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      }}>
        <div style={{
          background: 'white',
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          fontFamily: "'Inter', Arial, sans-serif",
          fontSize: '10pt',
          color: '#000',
        }}>
          {type === 'bloeddruk' && (
            <BloeddrukContent {...props} printDate={printDate} />
          )}
          {type === 'rapporten' && (
            <RapportenContent {...props} printDate={printDate} />
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
