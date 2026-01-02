import { createContext, useContext, useState } from 'react'
import { loadSavedTheme, applyTheme, saveTheme } from '@/lib/theme'

function initializeTheme() {
    const saved = loadSavedTheme()
    if(saved){
        applyTheme(saved)
        return saved
    } else {
        const defaultDark = {
            id: 'vercelDark',
            name: 'Vercel Dark',
            primary: '#ffffff',
            secondary: '#888888',
            background: '#000000',
            foreground: '#1a1a1a',
            mode: 'dark',
            font: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }
        applyTheme(defaultDark)
        return defaultDark
    }
}

export const ThemeContext = createContext({
    themeMode: 'dark',
    darkTheme: ()=>{},
    lightTheme: ()=>{}
})

export function ThemeProvider({ children }){
    const initialTheme = initializeTheme()
    const [themeMode, setThemeMode] = useState(initialTheme.mode === 'dark' ? 'dark' : 'light')

    function darkTheme(){
        const cur = loadSavedTheme() || {}
        cur.mode = 'dark'
        saveTheme(cur)
        applyTheme(cur)
        setThemeMode('dark')
    }

    function lightTheme(){
        const cur = loadSavedTheme() || {}
        cur.mode = 'light'
        saveTheme(cur)
        applyTheme(cur)
        setThemeMode('light')
    }

    return (
        <ThemeContext.Provider value={{ themeMode, darkTheme, lightTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export default function useTheme(){
    return useContext(ThemeContext)
}