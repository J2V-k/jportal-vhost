import { useState, useEffect } from 'react'
import { applyTheme, saveTheme, loadSavedTheme } from '@/lib/theme'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './dialog'
import { Palette } from 'lucide-react'

export default function ThemeDialog({ open, onClose }) {
  const [primary, setPrimary] = useState('#0b0d0d')
  const [secondary, setSecondary] = useState('#6b7280')
  const [background, setBackground] = useState('#ffffff')
  const [foreground, setForeground] = useState('#f3f4f6')
  const [selectedPalette, setSelectedPalette] = useState(null)

  const [customTheme, setCustomTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('jp-custom-theme')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  const presets = [
    {
      name: 'Default Light',
      primary: '#09090b',
      secondary: '#71717a',
      background: '#ffffff',
      foreground: '#f4f4f5',
    },
    {
      name: 'Default Dark',
      primary: '#fafafa',
      secondary: '#a1a1aa',
      background: '#09090b',
      foreground: '#18181b',
    },
    {
      name: 'Midnight Blue',
      primary: '#e2e8f0',
      secondary: '#94a3b8',
      background: '#0f172a',
      foreground: '#1e293b',
    },
    {
      name: 'Forest',
      primary: '#ecfdf5',
      secondary: '#6ee7b7',
      background: '#022c22',
      foreground: '#064e3b',
    },
    {
      name: 'Sunset',
      primary: '#4a044e',
      secondary: '#a21caf',
      background: '#fff7ed',
      foreground: '#ffedd5',
    },
    {
      name: 'Ocean',
      primary: '#0c4a6e',
      secondary: '#0369a1',
      background: '#f0f9ff',
      foreground: '#e0f2fe',
    },
    {
      name: 'Lavender',
      primary: '#3b0764',
      secondary: '#7e22ce',
      background: '#faf5ff',
      foreground: '#f3e8ff',
    },
    {
      name: 'Slate',
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      background: '#334155',
      foreground: '#475569',
    },
    {
      name: 'Rose',
      primary: '#881337',
      secondary: '#be123c',
      background: '#fff1f2',
      foreground: '#ffe4e6',
    },
    {
      name: 'Coffee',
      primary: '#efeae6',
      secondary: '#d6cbb8',
      background: '#282420',
      foreground: '#3d3632',
    },
    {
      name: 'Mint',
      primary: '#064e3b',
      secondary: '#059669',
      background: '#f0fdf4',
      foreground: '#dcfce7',
    },
    {
      name: 'Terminal',
      primary: '#00ff00',
      secondary: '#00cc00',
      background: '#000000',
      foreground: '#1a1a1a',
    },
    {
      name: 'Dracula',
      primary: '#f8f8f2',
      secondary: '#bd93f9',
      background: '#282a36',
      foreground: '#44475a',
    },
    {
      name: 'Nord',
      primary: '#d8dee9',
      secondary: '#88c0d0',
      background: '#2e3440',
      foreground: '#3b4252',
    },
    {
      name: 'Cyberpunk',
      primary: '#00e5ff',
      secondary: '#d600ff',
      background: '#090014',
      foreground: '#180024',
    }
  ]

  useEffect(() => {
    const saved = loadSavedTheme()

    const savedCustom = localStorage.getItem('jp-custom-theme')
    if (savedCustom) {
      try {
        setCustomTheme(JSON.parse(savedCustom))
      } catch (e) { }
    }

    if (saved) {
      setPrimary(saved.primary)
      setSecondary(saved.secondary)
      setBackground(saved.background)
      setForeground(saved.foreground)

      const idx = presets.findIndex(p =>
        p.primary === saved.primary &&
        p.secondary === saved.secondary &&
        p.background === saved.background &&
        p.foreground === saved.foreground
      )

      if (idx >= 0) {
        setSelectedPalette(idx)
      } else {
        setSelectedPalette('custom')
      }
    } else {
      setSelectedPalette(0)
    }
  }, [])

  function handleColorChange(key, value) {
    let newPrimary = primary;
    let newSecondary = secondary;
    let newBackground = background;
    let newForeground = foreground;

    if (key === 'primary') { setPrimary(value); newPrimary = value; }
    if (key === 'secondary') { setSecondary(value); newSecondary = value; }
    if (key === 'background') { setBackground(value); newBackground = value; }
    if (key === 'foreground') { setForeground(value); newForeground = value; }

    const newCustom = {
      primary: newPrimary,
      secondary: newSecondary,
      background: newBackground,
      foreground: newForeground
    }

    // Automatically switch to 'custom' mode when editing
    setSelectedPalette('custom')
    setCustomTheme(newCustom)
    localStorage.setItem('jp-custom-theme', JSON.stringify(newCustom))

    applyTheme(newCustom)
  }

  function handleSave() {
    const theme = { primary, secondary, background, foreground }
    applyTheme(theme)
    saveTheme(theme)
    onClose?.()
  }

  function selectPalette(idx) {
    const p = presets[idx]
    setSelectedPalette(idx)
    setPrimary(p.primary)
    setSecondary(p.secondary)
    setBackground(p.background)
    setForeground(p.foreground)
    applyTheme({ ...p })
    saveTheme({ ...p })
  }

  function selectCustom() {
    if (!customTheme) return
    setSelectedPalette('custom')
    setPrimary(customTheme.primary)
    setSecondary(customTheme.secondary)
    setBackground(customTheme.background)
    setForeground(customTheme.foreground)
    applyTheme({ ...customTheme })
    saveTheme({ ...customTheme })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.() }}>
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle>Customize Theme</DialogTitle>
          <DialogDescription>Select a preset or create your own custom style.</DialogDescription>
        </DialogHeader>

        {selectedPalette === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col text-sm">Primary Text
              <input aria-label="Primary Text Color" type="color" value={primary} onChange={e => handleColorChange('primary', e.target.value)} className="w-full h-10 mt-1 cursor-pointer" />
              <span className="text-xs text-muted-foreground mt-1">{primary}</span>
            </label>
            <label className="flex flex-col text-sm">Secondary Text
              <input aria-label="Secondary Text Color" type="color" value={secondary} onChange={e => handleColorChange('secondary', e.target.value)} className="w-full h-10 mt-1 cursor-pointer" />
              <span className="text-xs text-muted-foreground mt-1">{secondary}</span>
            </label>
            <label className="flex flex-col text-sm">Main Background
              <input aria-label="Main Background Color" type="color" value={background} onChange={e => handleColorChange('background', e.target.value)} className="w-full h-10 mt-1 cursor-pointer" />
              <span className="text-xs text-muted-foreground mt-1">{background}</span>
            </label>
            <label className="flex flex-col text-sm">Second Background (Cards)
              <input aria-label="Second Background Color" type="color" value={foreground} onChange={e => handleColorChange('foreground', e.target.value)} className="w-full h-10 mt-1 cursor-pointer" />
              <span className="text-xs text-muted-foreground mt-1">{foreground}</span>
            </label>
          </div>
        )}

        <div className="mt-4">
          <div className="text-sm text-muted-foreground mb-2">Presets</div>
          <div className="grid grid-cols-2 gap-2">

            {presets.map((p, i) => (
              <button key={p.name} onClick={() => selectPalette(i)} className={`flex items-center gap-2 p-2 rounded border transition-all ${selectedPalette === i ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'} text-card-foreground`}>
                <div className="w-16 h-6 rounded overflow-hidden flex border border-gray-200 dark:border-gray-700 shrink-0">
                  <div style={{ background: p.background }} className="flex-1" />
                  <div style={{ background: p.foreground }} className="flex-1" />
                  <div style={{ background: p.primary }} className="flex-1" />
                  <div style={{ background: p.secondary }} className="flex-1" />
                </div>
                <div className="text-xs font-medium truncate flex-1 text-left">{p.name}</div>
              </button>
            ))}


            <button
              onClick={selectCustom}
              disabled={!customTheme}
              className={`flex items-center gap-2 p-2 rounded border transition-all ${selectedPalette === 'custom' ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'} text-card-foreground disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="w-16 h-6 rounded overflow-hidden flex border border-gray-200 dark:border-gray-700 shrink-0">
                {customTheme ? (
                  <>
                    <div style={{ background: customTheme.background }} className="flex-1" />
                    <div style={{ background: customTheme.foreground }} className="flex-1" />
                    <div style={{ background: customTheme.primary }} className="flex-1" />
                    <div style={{ background: customTheme.secondary }} className="flex-1" />
                  </>
                ) : (
                  <div className="flex-1 bg-muted flex items-center justify-center text-[10px] text-muted-foreground">None</div>
                )}
              </div>
              <div className="text-xs font-medium truncate flex-1 text-left">My Custom Theme</div>
              {selectedPalette === 'custom' && <Palette size={14} className="text-primary shrink-0" />}
            </button>
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full justify-end gap-2">
            <button className="px-4 py-2 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={onClose}>Close</button>
            <button className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>Save Changes</button>
          </div>
        </DialogFooter>

        <DialogClose />
      </DialogContent>
    </Dialog>
  )
}
