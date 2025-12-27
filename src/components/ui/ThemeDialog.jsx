import { useState, useEffect } from 'react'
import { applyTheme, saveTheme, loadSavedTheme, getThemeCategories, getPresetsByCategory } from '@/lib/theme'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './dialog'
import { Palette } from 'lucide-react'

export default function ThemeDialog({ open, onClose }) {
  const [primary, setPrimary] = useState('#0b0d0d')
  const [secondary, setSecondary] = useState('#6b7280')
  const [background, setBackground] = useState('#ffffff')
  const [foreground, setForeground] = useState('#f3f4f6')
  const [font, setFont] = useState('-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
  const [selectedPalette, setSelectedPalette] = useState(null)

  const [customTheme, setCustomTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('jp-custom-theme')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  const [presets, setPresets] = useState({})
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const cats = await getThemeCategories()
        setCategories(cats)
        
        const presetData = {}
        for (const cat of Object.keys(cats)) {
          presetData[cat] = await getPresetsByCategory(cat)
        }
        setPresets(presetData)
      } catch (error) {
        console.error('Error loading presets:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadPresets()
  }, [])

  useEffect(() => {
    if (loading) return
    
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
      if (saved.font) {
        setFont(saved.font)
      }

      let foundPreset = null
      for (const cat in presets) {
        const catPresets = presets[cat]
        const preset = catPresets.find(p =>
          p.primary === saved.primary &&
          p.secondary === saved.secondary &&
          p.background === saved.background &&
          p.foreground === saved.foreground
        )
        if (preset) {
          foundPreset = preset.id
          break
        }
      }

      if (foundPreset) {
        setSelectedPalette(foundPreset)
      } else {
        setSelectedPalette('custom')
      }
    } else {
      setSelectedPalette(null) // No default selection
    }
  }, [loading, presets])

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
      foreground: newForeground,
      font: font
    }
    setSelectedPalette('custom')
    setCustomTheme(newCustom)
    localStorage.setItem('jp-custom-theme', JSON.stringify(newCustom))

    applyTheme(newCustom)
  }

  function handleSave() {
    const theme = { primary, secondary, background, foreground, font }
    applyTheme(theme)
    saveTheme(theme)
    onClose?.()
  }

  function selectPalette(presetId) {
    for (const cat in presets) {
      const catPresets = presets[cat]
      const preset = catPresets.find(p => p.id === presetId)
      if (preset) {
        setSelectedPalette(presetId)
        setPrimary(preset.primary)
        setSecondary(preset.secondary)
        setBackground(preset.background)
        setForeground(preset.foreground)
        setFont(preset.font)
        applyTheme({ ...preset })
        saveTheme({ ...preset })
        return
      }
    }
  }

  function selectCustom() {
    if (!customTheme) return
    setSelectedPalette('custom')
    setPrimary(customTheme.primary)
    setSecondary(customTheme.secondary)
    setBackground(customTheme.background)
    setForeground(customTheme.foreground)
    if (customTheme.font) {
      setFont(customTheme.font)
    }
    applyTheme({ ...customTheme })
    saveTheme({ ...customTheme })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose?.() }}>
      <DialogContent className="w-[95vw] sm:max-w-lg max-h-[85vh] rounded-lg flex flex-col overflow-hidden p-0 gap-0">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle>Customize Theme</DialogTitle>
            <DialogDescription>Select a preset or create your own custom style.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {selectedPalette === 'custom' && (
            <div className="grid grid-cols-2 gap-3 mb-4">
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

          <div className="mt-2">
            <div className="text-sm text-muted-foreground mb-2">Presets</div>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading presets...</div>
            ) : (
              Object.entries(categories).map(([catKey, catInfo]) => (
                <div key={catKey} className="mb-4">
                  <div className="text-sm font-medium mb-2">{catInfo.label}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {presets[catKey]?.map((p) => (
                      <button 
                        key={p.id} 
                        onClick={() => selectPalette(p.id)} 
                        className={`flex items-center gap-2 p-2 rounded border transition-all ${selectedPalette === p.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'} text-card-foreground`}
                      >
                        <div className="w-16 h-6 rounded overflow-hidden flex border border-gray-200 dark:border-gray-700 shrink-0">
                          <div style={{ background: p.background }} className="flex-1" />
                          <div style={{ background: p.foreground }} className="flex-1" />
                          <div style={{ background: p.primary }} className="flex-1" />
                          <div style={{ background: p.secondary }} className="flex-1" />
                        </div>
                        <div className="text-xs font-medium truncate flex-1 text-left">{p.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}

            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Custom</div>
              <div className="grid grid-cols-2 gap-2">
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
          </div>
        </div>

        <div className="p-6 pt-2">
          <DialogFooter>
            <div className="flex w-full justify-end gap-2">
              <button className="px-4 py-2 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={onClose}>Close</button>
              <button className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSave}>Save Changes</button>
            </div>
          </DialogFooter>
        </div>

        <DialogClose className="top-4 right-4" />
      </DialogContent>
    </Dialog>
  )
}
