/**
 * Active session context.
 * Stores the result of the most recent successful access evaluation
 * so the Active Session page can display it without re-fetching.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  /*
   * session shape:
   * {
   *   user            : { name, role }
   *   resource        : { id, name, sensitivity_level }
   *   deviceTrusted   : boolean
   *   deviceName      : string
   *   riskLevel       : 'low' | 'medium' | 'high'
   *   riskScore       : number
   *   decision        : string
   *   accessRequestId : string
   *   grantedAt       : ISO string
   * }
   */

  const startSession = useCallback((data) => {
    setSession({ ...data, grantedAt: new Date().toISOString() });
  }, []);

  const clearSession = useCallback(() => setSession(null), []);

  const updateSessionRisk = useCallback((riskLevel, riskScore) => {
    setSession((prev) => prev ? { ...prev, riskLevel, riskScore } : null);
  }, []);

  return (
    <SessionContext.Provider value={{ session, startSession, clearSession, updateSessionRisk }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
