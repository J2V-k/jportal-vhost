import { useState } from 'react'
import useTheme from '../../context/ThemeContext'
import { Palette } from 'lucide-react'
import ThemeDialog from './ThemeDialog'

function ThemeBtn() {
    const { themeMode } = useTheme()
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="p-0.5 rounded-full relative focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
                aria-label="Open theme dialog"
                style={{ background: 'transparent' }}
            >
                <span
                    aria-hidden
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full"
                    style={{
                        background: 'hsl(var(--primary))',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                    }}
                >
                    <Palette className="w-6 h-6" style={{ color: 'hsl(var(--primary-foreground))' }} />
                </span>
            </button>
            <ThemeDialog open={open} onClose={() => setOpen(false)} />
        </>
    )
}

export default ThemeBtn
