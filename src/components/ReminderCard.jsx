import { useState } from 'react'
import { Field, inputStyle } from './Ui'

// Rappel quotidien : un événement répétitif à ajouter à son agenda (iPhone, Android, Google Agenda…).
function buildIcs(time, url) {
  const [hh, mm] = time.split(':')
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Fissure//Rappel//FR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:fissure-rappel-${Date.now()}@fissure`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${ymd}T${hh}${mm}00`,
    `DTEND:${ymd}T${hh}${String(Math.min(59, Number(mm) + 5)).padStart(2, '0')}00`,
    'RRULE:FREQ=DAILY',
    'SUMMARY:Fissure : coche tes habitudes',
    `DESCRIPTION:Ouvre Fissure et coche ta journée. ${url}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Fissure : coche tes habitudes',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export default function ReminderCard() {
  const [time, setTime] = useState('21:00')

  function download() {
    const blob = new Blob([buildIcs(time, window.location.origin)], { type: 'text/calendar;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'rappel-fissure.ics'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Field label="Heure du rappel"
      help={<>Ajoute à ton agenda un événement qui se répète chaque jour : il te rappelle de cocher tes habitudes, avec le lien de l’app.</>}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input type="time" value={time} onChange={e => setTime(e.target.value || '21:00')} style={{ ...inputStyle, flex: 1 }} />
        <button onClick={download} style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: '12px', padding: '0 18px', fontWeight: 700, fontSize: '14px', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer' }}>
          Ajouter
        </button>
      </div>
    </Field>
  )
}
