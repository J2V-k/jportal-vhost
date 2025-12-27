import { createContext, useContext, useState, useEffect } from 'react'
import { loadSavedTheme, applyTheme, saveTheme } from '@/lib/theme'

export const ThemeContext = createContext({
    themeMode: 'dark',
    darkTheme: ()=>{},
    lightTheme: ()=>{}
})

export function ThemeProvider({ children }){
    const [themeMode, setThemeMode] = useState('dark')

    useEffect(()=>{
        const saved = loadSavedTheme()
        if(saved){
            applyTheme(saved)
            setThemeMode(saved.mode === 'dark' ? 'dark' : 'light')
        } else {
            const defaultDark = {
                name: 'Default Dark',
                primary: '#fafafa',
                secondary: '#a1a1aa',
                background: '#09090b',
                foreground: '#18181b',
                mode: 'dark',
                font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }
            applyTheme(defaultDark)
            setThemeMode('dark')
        }
    },[])

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