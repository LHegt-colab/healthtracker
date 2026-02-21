import { useState } from 'react'

const KEY = 'ht_patient_profile'
const defaults = { naam: '', geboortedatum: '', huisarts: '', bsn: '' }

export function useProfile() {
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(KEY)
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults
    } catch {
      return defaults
    }
  })

  function saveProfile(updates) {
    const next = { ...profile, ...updates }
    setProfile(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  return { profile, saveProfile }
}
