import { useState, useEffect, useCallback } from 'react'
import type { Role } from '../types'

const STORAGE_KEY = 'chat-analyst-role'

export function useRole(): [Role | null, (role: Role) => void, () => void] {
  const [role, setRoleState] = useState<Role | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Role | null
    if (stored) setRoleState(stored)
  }, [])

  const setRole = useCallback((r: Role) => {
    localStorage.setItem(STORAGE_KEY, r)
    setRoleState(r)
  }, [])

  const clearRole = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setRoleState(null)
  }, [])

  return [role, setRole, clearRole]
}
