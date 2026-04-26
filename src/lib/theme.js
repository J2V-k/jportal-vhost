// --- Core Math Utilities ---

function hexToHsl(hex) {
  if (!hex || typeof hex !== 'string') return '0 0% 0%';
  // Pass through safely if it's already a valid CSS function to prevent Tailwind crashes
  if (!hex.startsWith('#')) return hex;
  
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return [255, 255, 255];
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return [
    parseInt(hex.substring(0, 2), 16),
    parseInt(hex.substring(2, 4), 16),
    parseInt(hex.substring(4, 6), 16)
  ];
}

function luminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastForeground(hex) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '0 0% 98%';
  const [r, g, b] = hexToRgb(hex);
  return luminance(r, g, b) > 0.179 ? '0 0% 9%' : '0 0% 98%';
}

function adjustLightness(hsl, delta) {
  const parts = hsl.split(' ');
  if (parts.length !== 3) return hsl;
  const h = parts[0];
  const s = parts[1];
  let l = parseFloat(parts[2].replace('%', ''));
  l = Math.max(0, Math.min(100, l + delta));
  return `${h} ${s} ${l}%`;
}


// --- The Hybrid Engine ---

export function applyTheme(theme, currentMode = null) {
  const root = document.documentElement;
  const style = root.style;
  
  if (!theme) return;

  // Determine Safe Mode
  let safeMode = currentMode || theme.mode || 'light';
  if (!theme.mode && theme.background) {
    const [r, g, b] = hexToRgb(theme.background);
    safeMode = luminance(r, g, b) < 0.5 ? 'dark' : 'light';
  }

  if (safeMode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // 1. ADVANCED EXPLICIT THEMES (Has 'styles' object)
  if (theme.styles && theme.styles[safeMode]) {
    const palette = theme.styles[safeMode];

    Object.entries(palette).forEach(([key, value]) => {
      // Direct pass-through for layout/shadows/fonts
      if (
        key === 'radius' || 
        key.startsWith('font-') || 
        key.startsWith('shadow-') || 
        key === 'letter-spacing' || 
        key === 'spacing'
      ) {
        style.setProperty(`--${key}`, value);
        if (key === 'font-sans') document.body.style.fontFamily = value;
      } 
      // HSL conversion for colors
      else if (typeof value === 'string') {
        if (value.startsWith('#')) {
          style.setProperty(`--${key}`, hexToHsl(value));
        } else {
          // If it's already an OKLCH or HSL string
          style.setProperty(`--${key}`, value);
        }
      }
    });

    // Generate primary text contrast if designer forgot to include it
    if (palette.primary && !palette['primary-foreground'] && palette.primary.startsWith('#')) {
      style.setProperty('--primary-foreground', contrastForeground(palette.primary));
    }
    return; // Exit here. Do not run legacy math.
  }

  // 2. LEGACY MATH THEMES (Custom color picker & older JSONs)
  let { primary, secondary, background, foreground, font, radius, borderColor } = theme;

  if (font) {
    style.setProperty('--font-sans', font);
    document.body.style.fontFamily = font;
  }
  style.setProperty('--radius', radius || '0.5rem');

  if (background && primary && secondary && foreground) {
    const bgHsl = hexToHsl(background);
    const surfaceHsl = hexToHsl(foreground); 
    const primaryHsl = hexToHsl(primary);
    const secondaryHsl = hexToHsl(secondary);

    // DYNAMIC TEXT COLOR FIX: Base text color on ACTUAL background brightness
    // This prevents black text on dark backgrounds if the app mode mismatches
    const [bgR, bgG, bgB] = hexToRgb(background);
    const isDarkBg = luminance(bgR, bgG, bgB) < 0.5;
    const mainTextHsl = isDarkBg ? '0 0% 98%' : '0 0% 9%';     

    // Do the same for Cards/Popovers independently
    const [cardR, cardG, cardB] = hexToRgb(foreground); // 'foreground' acts as the card bg in legacy math
    const isDarkCard = luminance(cardR, cardG, cardB) < 0.5;
    const cardTextHsl = isDarkCard ? '0 0% 98%' : '0 0% 9%';     

    style.setProperty('--background', bgHsl);
    style.setProperty('--foreground', mainTextHsl);

    style.setProperty('--card', surfaceHsl);
    style.setProperty('--card-foreground', cardTextHsl);
    style.setProperty('--popover', surfaceHsl);
    style.setProperty('--popover-foreground', cardTextHsl);

    style.setProperty('--primary', primaryHsl);
    style.setProperty('--primary-foreground', contrastForeground(primary));

    style.setProperty('--secondary', secondaryHsl);
    style.setProperty('--secondary-foreground', contrastForeground(secondary));

    style.setProperty('--muted', adjustLightness(surfaceHsl, isDarkCard ? 4 : -4));
    style.setProperty('--muted-foreground', isDarkCard ? '0 0% 65%' : '0 0% 40%');

    style.setProperty('--accent', adjustLightness(secondaryHsl, isDarkCard ? -10 : 10));
    style.setProperty('--accent-foreground', contrastForeground(secondary));

    style.setProperty('--destructive', '0 84.2% 60.2%');
    style.setProperty('--destructive-foreground', '0 0% 98%');

    if (borderColor) {
      style.setProperty('--border', hexToHsl(borderColor));
      style.setProperty('--input', hexToHsl(borderColor));
    } else {
      const generatedBorder = adjustLightness(surfaceHsl, isDarkCard ? 8 : -10);
      style.setProperty('--border', generatedBorder);
      style.setProperty('--input', generatedBorder);
    }
    style.setProperty('--ring', primaryHsl);
  }
}


// --- Data Fetching & Storage ---

import { getJPTheme, setJPTheme, getThemePresetsCache, setThemePresetsCache } from '@/components/scripts/cache' 

export function loadSavedTheme() {
  try {
    return getJPTheme()
  } catch (e) { return null }
}

export function saveTheme(theme) {
  try { setJPTheme(theme) } catch (e) { }
}

let themePresetsData = null

async function loadThemePresetsFromFile() {
  if (themePresetsData) return themePresetsData
  try {
    const cached = getThemePresetsCache()
    if (cached) {
      themePresetsData = cached
      return themePresetsData
    }
    const response = await fetch('https://cdn.jsdelivr.net/gh/J2V-k/jportal-vhost@main/public/theme-presets.json')
    if (!response.ok) throw new Error('Failed to load theme-presets.json')
    themePresetsData = await response.json()
    setThemePresetsCache(themePresetsData)
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