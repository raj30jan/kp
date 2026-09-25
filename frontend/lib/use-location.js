import { useEffect, useState } from 'react'
import { api } from './api'

/**
 * Cascading India location selectors — state -> district -> tehsil(city).
 * The services module stores location *names* (not ids), so callers keep the
 * selected option's name for the API while using ids to drive the cascade.
 * Built for non-technical users: pick from dropdowns instead of typing.
 */

// India's states (resolved once via the countries list).
export function useIndiaStates() {
  const [states, setStates] = useState([])
  useEffect(() => {
    let mounted = true
    api.getCountries()
      .then((cs) => {
        const india = (Array.isArray(cs) ? cs : []).find(
          (c) => c.isoCode2 === 'IN' || /india/i.test(c.name || ''),
        )
        return india ? api.getStates(india.id) : []
      })
      .then((ss) => mounted && setStates(Array.isArray(ss) ? ss : []))
      .catch(() => {})
    return () => { mounted = false }
  }, [])
  return states
}

// Districts for a state id.
export function useDistricts(stateId) {
  const [districts, setDistricts] = useState([])
  useEffect(() => {
    if (!stateId) { setDistricts([]); return }
    let mounted = true
    api.getDistricts(stateId)
      .then((d) => mounted && setDistricts(Array.isArray(d) ? d : []))
      .catch(() => {})
    return () => { mounted = false }
  }, [stateId])
  return districts
}

// Tehsils / cities for a district id.
export function useTehsils(districtId) {
  const [tehsils, setTehsils] = useState([])
  useEffect(() => {
    if (!districtId) { setTehsils([]); return }
    let mounted = true
    api.getCities(districtId)
      .then((c) => mounted && setTehsils(Array.isArray(c) ? c : []))
      .catch(() => {})
    return () => { mounted = false }
  }, [districtId])
  return tehsils
}
