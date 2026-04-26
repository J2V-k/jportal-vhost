import { useState, useEffect } from 'react'
import { applyTheme, saveTheme, loadSavedTheme } from '@/lib/theme'
import { getThemePresetsCache, setThemePresetsCache } from '@/components/scripts/cache' 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog'
import { Palette, Check, Settings2, Moon, Sun, LayoutGrid } from 'lucide-react'
import { Button } from './button'
import { Separator } from './separator'
import useTheme from '@/context/ThemeContext' 

export default function ThemeDialog({ open, onClose }) {
  const { themeMode } = useTheme(); // Get current global mode
  const [primary, setPrimary] = useState('#0b0d0d')
  const [secondary, setSecondary] = useState('#6b7280')
  const [background, setBackground] = useState('#ffffff')
  const [foreground, setForeground] = useState('#f3f4f6')
  const [font, setFont] = useState('-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif')
  const [selectedPalette, setSelectedPalette] = useState(null)
  const [radiusVal, setRadiusVal] = useState(8)
  
  const [themeData, setThemeData] = useState({ presets: {}, categories: {} })
  const [loading, setLoading] = useState(true)
  const [showAdjust, setShowAdjust] = useState(false)

  // Helper to extract safe colors regardless of whether it's an advanced or legacy theme
  const getThemeColors = (t, mode) => {
    const isAdvanced = t.styles && t.styles[mode];
    return {
      primary: isAdvanced ? t.styles[mode].primary : t.primary,
      secondary: isAdvanced ? t.styles[mode].secondary : t.secondary,
      background: isAdvanced ? t.styles[mode].background : t.background,
      foreground: isAdvanced ? (t.styles[mode].card || t.styles[mode].foreground) : t.foreground,
      radius: isAdvanced ? t.styles[mode].radius : t.radius,
      font: isAdvanced ? t.styles[mode]['font-sans'] : t.font
    }
  }

  useEffect(() => {
    const initThemes = async () => {
      try {
        const cached = getThemePresetsCache()
        if (cached) {
          setThemeData(cached)
          setLoading(false)
          return
        }
        
        const response = await fetch('https://cdn.jsdelivr.net/gh/J2V-k/jportal-vhost@main/public/theme-presets.json')
        const data = await response.json()
        setThemeData(data)
        setThemePresetsCache(data)
      } catch (error) {
        console.error('Error loading themes:', error)
      } finally {
        setLoading(false)
      }
    }
    if (open) initThemes()
  }, [open])

  useEffect(() => {
    if (loading) return
    const saved = loadSavedTheme()
    if (saved) {
      const colors = getThemeColors(saved, themeMode);
      setPrimary(colors.primary)
      setSecondary(colors.secondary)
      setBackground(colors.background)
      setForeground(colors.foreground)
      setFont(colors.font || font)

      if (colors.radius) {
        if (String(colors.radius).endsWith('px')) setRadiusVal(parseInt(colors.radius))
        else if (String(colors.radius).endsWith('rem')) setRadiusVal(Math.round(parseFloat(colors.radius) * 16))
        else setRadiusVal(parseInt(colors.radius) || 8)
      }
      
      setSelectedPalette(saved.id || 'custom-mod')
    }
  }, [loading, themeData, themeMode])

  const handleColorChange = (key, value) => {
    // Note: Manual adjustment strips advanced theming and converts it back to a customizable legacy math theme
    const newTheme = { primary, secondary, background, foreground, font, radius: `${radiusVal}px`, [key]: value, mode: themeMode }
    if (key === 'primary') setPrimary(value)
    if (key === 'secondary') setSecondary(value)
    if (key === 'background') setBackground(value)
    if (key === 'foreground') setForeground(value)
    setSelectedPalette('custom-mod')
    applyTheme(newTheme, themeMode)
  }

  const handleRadiusChange = (value) => {
    setRadiusVal(value)
    const newTheme = { primary, secondary, background, foreground, font, radius: `${value}px`, mode: themeMode }
    setSelectedPalette('custom-mod')
    applyTheme(newTheme, themeMode)
  }

  const CompactSwatch = ({ preset, active }) => {
    const isDark = themeMode === 'dark';
    const c = getThemeColors(preset, isDark ? 'dark' : 'light');
    
    return (
      <div className="relative w-full h-10 rounded-lg overflow-hidden flex border border-border/40 group-hover:border-primary/40 transition-all shadow-sm">
        <div style={{ background: c.background }} className="w-[45%]" />
        <div style={{ background: c.foreground }} className="w-[25%]" />
        <div style={{ background: c.primary }} className="w-[20%]" />
        <div style={{ background: c.secondary }} className="w-[10%]" />
        <div className="absolute top-1 right-1 opacity-40 group-hover:opacity-100 transition-opacity">
          {isDark ? <Moon size={8} className="text-white" /> : <Sun size={8} className="text-black" />}
        </div>
        {active && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
            <div className="bg-primary rounded-full p-0.5 shadow-lg">
              <Check size={10} className="text-primary-foreground" strokeWidth={4} />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden border-none shadow-2xl bg-card h-[90vh] sm:h-auto">
        <div className="px-4 py-3 bg-muted/20 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Palette size={18} strokeWidth={2.5} />
            <DialogTitle className="text-sm font-bold uppercase tracking-widest">Theme Gallery</DialogTitle>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-7 px-3 gap-1.5 rounded-md transition-colors ${showAdjust ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'hover:bg-primary/10 hover:text-primary'}`}
            onClick={() => setShowAdjust(!showAdjust)}
          >
            <Settings2 size={12} />
            <span className="text-[10px] font-bold uppercase">Manual Adjust</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[70vh] p-4 custom-scrollbar space-y-6">
          {showAdjust && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-xl border border-border/50 animate-in fade-in slide-in-from-top-1 duration-200">
              {[
                { label: 'Primary', key: 'primary', val: primary },
                { label: 'Secondary', key: 'secondary', val: secondary },
                { label: 'Base Bg', key: 'background', val: background },
                { label: 'Card Bg', key: 'foreground', val: foreground },
              ].map((color) => (
                <div key={color.key} className="space-y-1">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">{color.label}</span>
                  <div className="flex items-center gap-2 bg-background p-1 rounded-md border border-border/50">
                    <input type="color" value={color.val} onChange={e => handleColorChange(color.key, e.target.value)} 
                      className="w-5 h-5 rounded-sm cursor-pointer border-none p-0 bg-transparent" />
                    <span className="text-[10px] font-mono font-bold text-foreground/70 uppercase select-all">{color.val}</span>
                  </div>
                </div>
              ))}

              <div className="space-y-1">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Radius</span>
                <div className="flex items-center gap-2 bg-background p-1 rounded-md border border-border/50">
                  <input type="range" min="0" max="24" value={radiusVal} onChange={e => { setRadiusVal(Number(e.target.value)); handleRadiusChange(Number(e.target.value)); }}
                    className="w-full" />
                  <span className="text-[10px] font-mono font-bold text-foreground/70 uppercase select-all">{radiusVal}px</span>
                </div>
              </div>
            </div>
          )}

          {Object.entries(themeData.categories).map(([key, cat]) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <LayoutGrid size={12} className="text-muted-foreground" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">{cat.label}</h4>
                <Separator className="flex-1 opacity-50" />
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {themeData.presets[key]?.map((p) => {
                  const colors = getThemeColors(p, themeMode);
                  return (
                    <button 
                      key={p.id} 
                      onClick={() => {
                        setSelectedPalette(p.id); 
                        setPrimary(colors.primary); 
                        setSecondary(colors.secondary);
                        setBackground(colors.background); 
                        setForeground(colors.foreground); 
                        setFont(colors.font);
                        if (colors.radius) {
                          if (String(colors.radius).endsWith('px')) setRadiusVal(parseInt(colors.radius))
                          else if (String(colors.radius).endsWith('rem')) setRadiusVal(Math.round(parseFloat(colors.radius) * 16))
                          else setRadiusVal(parseInt(colors.radius) || 8)
                        }
                        // Important: Send the full preset to applyTheme!
                        applyTheme({ ...p, mode: themeMode }, themeMode);
                      }} 
                      className={`group flex flex-col gap-1.5 p-1.5 rounded-xl border transition-all text-left ${
                        selectedPalette === p.id 
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' 
                        : 'border-transparent hover:bg-muted/50 hover:border-border/50'
                      }`}
                    >
                      <CompactSwatch preset={p} active={selectedPalette === p.id} />
                      <span className="text-[10px] font-bold truncate tracking-tight text-foreground/90 px-0.5">{p.name || p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 bg-muted/10 border-t flex items-center justify-between">
          <div className="hidden sm:block">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
              {Object.values(themeData.presets).flat().length} Presets Loaded
            </span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-8 text-[10px] font-bold uppercase tracking-wider px-4" onClick={onClose}>Discard</Button>
            <Button size="sm" className="flex-1 sm:flex-none h-8 text-[10px] font-bold uppercase tracking-wider px-8 shadow-md shadow-primary/20" 
              onClick={() => { 
                // If they manually adjusted, save the manual theme. Otherwise, save the full selected preset.
                if (selectedPalette === 'custom-mod') {
                  saveTheme({ id: 'custom-mod', primary, secondary, background, foreground, font, radius: `${radiusVal}px`, mode: themeMode });
                } else {
                  // Find the selected preset object
                  let selectedObj = null;
                  Object.values(themeData.presets).forEach(cat => {
                    const found = cat.find(p => p.id === selectedPalette);
                    if (found) selectedObj = found;
                  });
                  if(selectedObj) saveTheme({ ...selectedObj, mode: themeMode });
                }
                onClose?.() 
              }}>
              Confirm Selection
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}