function hexToHsl(hex) {
  hex = hex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

function hexToRgb(hex) {
  hex = hex.replace('#', '')
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16)
  ]
}

function luminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
}

function contrastForeground(hex) {
  const [r, g, b] = hexToRgb(hex)
  return luminance(r, g, b) > 0.5 ? '0 0% 9%' : '0 0% 98%'
}

function adjustLightness(hsl, delta) {
  const parts = hsl.split(' ')
  if (parts.length !== 3) return hsl
  const h = parts[0]
  const s = parts[1]
  let l = parseInt(parts[2].replace('%', ''))
  l = Math.max(0, Math.min(100, l + delta))
  return `${h} ${s} ${l}%`
}

export function applyTheme(theme) {
  const root = document.documentElement
  const style = root.style
  let { primary, secondary, background, foreground, mode, font, radius, borderColor } = theme || {}

  if (!mode && background) {
    const [r, g, b] = hexToRgb(background)
    const lum = luminance(r, g, b)
    mode = lum < 0.5 ? 'dark' : 'light'
  }

  const safeMode = mode || 'light'

  if (safeMode === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  if (font) {
    style.setProperty('--font-family', font)
    document.body.style.fontFamily = font
  }

  style.setProperty('--radius', radius || '0.5rem')

  if (background && primary && secondary && foreground) {
    const bgHsl = hexToHsl(background)
    const fgHsl = hexToHsl(primary)
    const secondBgHsl = hexToHsl(foreground)
    const secondaryTextHsl = hexToHsl(secondary)

    style.setProperty('--background', bgHsl)
    style.setProperty('--foreground', fgHsl)

    style.setProperty('--card', secondBgHsl)
    style.setProperty('--card-foreground', fgHsl)

    style.setProperty('--popover', secondBgHsl)
    style.setProperty('--popover-foreground', fgHsl)

    style.setProperty('--primary', fgHsl)
    style.setProperty('--primary-foreground', contrastForeground(primary))

    style.setProperty('--secondary', secondBgHsl)
    style.setProperty('--secondary-foreground', fgHsl)

    style.setProperty('--muted', secondBgHsl)
    style.setProperty('--muted-foreground', secondaryTextHsl)

    style.setProperty('--accent', secondBgHsl)
    style.setProperty('--accent-foreground', fgHsl)

    style.setProperty('--destructive', '0 84.2% 60.2%')
    style.setProperty('--destructive-foreground', '0 0% 98%')

    if (borderColor) {
      const borderHsl = hexToHsl(borderColor)
      style.setProperty('--border', borderHsl)
      style.setProperty('--input', borderHsl)
    } else {
      style.setProperty('--border', adjustLightness(secondBgHsl, safeMode === 'dark' ? 12 : -12))
      style.setProperty('--input', adjustLightness(secondBgHsl, safeMode === 'dark' ? 12 : -12))
    }

    style.setProperty('--ring', fgHsl)
  }
}

export function loadSavedTheme() {
  try {
    const raw = localStorage.getItem('jp-theme')
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) { return null }
}

export function saveTheme(theme) {
  try { localStorage.setItem('jp-theme', JSON.stringify(theme)) } catch (e) { }
}

let themePresetsData = null

async function loadThemePresetsFromFile() {
  if (themePresetsData) return themePresetsData
  
  try {
    const cached = localStorage.getItem('jportal_theme_presets_v2')
    if (cached) {
      themePresetsData = JSON.parse(cached)
      return themePresetsData
    }
    
    const response = await fetch('https://cdn.jsdelivr.net/gh/J2V-k/jportal-vhost@main/public/theme-presets.json')
    if (!response.ok) throw new Error('Failed to load theme-presets.json')
    themePresetsData = await response.json()
    localStorage.setItem('jportal_theme_presets_v2', JSON.stringify(themePresetsData))
    return themePresetsData
  } catch (error) {
    console.error('Error loading theme presets:', error)
    return null
  }
}

export async function getAllThemePresets() {
  const data = await loadThemePresetsFromFile()
  if (!data || !data.presets) return {}
  
  const allPresets = {}
  Object.values(data.presets).forEach(categoryPresets => {
    if (Array.isArray(categoryPresets)) {
      categoryPresets.forEach(preset => {
        allPresets[preset.id] = preset
      })
    }
  })
  
  return allPresets
}

export async function getPresetsByCategory(category) {
  const data = await loadThemePresetsFromFile()
  if (!data || !data.presets || !data.presets[category]) return []
  return data.presets[category]
}

export async function getThemeCategories() {
  const data = await loadThemePresetsFromFile()
  if (!data || !data.categories) return {}
  return data.categories
}

export async function getPresetById(id) {
  const allPresets = await getAllThemePresets()
  return allPresets[id] || null
}