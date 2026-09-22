'use client'

import { createContext, useContext } from 'react'

export const LangContext = createContext({ lang: 'hi', setLang: () => {} })

export function LangProvider({ children, value }) {
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}
