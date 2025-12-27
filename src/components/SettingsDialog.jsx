import { useState, useEffect } from 'react';
import useTheme from '../context/ThemeContext';
import { applyTheme, saveTheme } from '@/lib/theme';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Settings, LogOut, Trash2, Sun, Moon, X } from 'lucide-react';
import InstallPWA from './InstallPWA';

const TABS = [
  { key: '/attendance', label: 'Attendance' },
  { key: '/grades', label: 'Grades' },
  { key: '/exams', label: 'Exams' },
  { key: '/subjects', label: 'Subjects' },
  { key: '/profile', label: 'Profile' },
  { key: 'auto', label: 'Auto' },
];

const MESS_MENU_VIEWS = [
  { key: 'daily', label: 'Daily View' },
  { key: 'weekly', label: 'Weekly View' },
];

export default function SettingsDialog({ onLogout, attendanceGoal, setAttendanceGoal }) {
  const { themeMode, darkTheme, lightTheme } = useTheme();
  const [themeDialogOpen, setThemeDialogOpen] = useState(false)
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem('defaultTheme') || 'light';
  });
  const [defaultTab, setDefaultTab] = useState(() => {
    return localStorage.getItem('defaultTab') || 'auto';
  });
  const [swipeEnabled, setSwipeEnabled] = useState(() => {
    return localStorage.getItem('swipeEnabled') !== 'false';
  });
  const [defaultMessMenuView, setDefaultMessMenuView] = useState(() => {
    return localStorage.getItem('defaultMessMenuView') || 'daily';
  });
  const [themePresets, setThemePresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState(() => {
    const saved = localStorage.getItem('jp-theme');
    if (saved) {
      try {
        const theme = JSON.parse(saved);
        return theme.id || '';
      } catch (e) {
        return '';
      }
    }
    return '';
  });
  const [showTimetableInNavbar, setShowTimetableInNavbar] = useState(() => {
    return localStorage.getItem('showTimetableInNavbar') === 'true';
  });

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const response = await fetch('/theme-presets.json');
        if (response.ok) {
          const data = await response.json();
          const allPresets = [];
          
          Object.entries(data.presets).forEach(([categoryKey, presets]) => {
            if (categoryKey !== 'custom' && Array.isArray(presets)) {
              allPresets.push(...presets);
            }
          });
          
          setThemePresets(allPresets);
        }
      } catch (error) {
        console.error('Error loading theme presets:', error);
      }
    };

    loadPresets();
  }, []);

  useEffect(() => {
    setSelectedTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (open) {
    }
  }, [open]);

  function applyThemePreset(preset) {
    applyTheme(preset);
    saveTheme(preset);
    setSelectedPresetId(preset.id);
    localStorage.setItem('selectedPreset', preset.id);
  }

  function handleThemeChange(theme) {
    setSelectedTheme(theme);
    applyTheme(theme);
  }

  function handleClearCache() {
    if (!confirm('Are you sure you want to clear ALL cached data? This will remove all stored data including login credentials and settings. You will need to log in again.')) {
      return;
    }
    const totalItems = localStorage.length;
    localStorage.clear();
    alert(`Successfully cleared all ${totalItems} cached items! The page will now reload.`);
    window.location.reload();
  }

  function handleDefaultTabChange(value) {
    setDefaultTab(value);
    localStorage.setItem('defaultTab', value);
  }

  function handleSwipeEnabledChange(value) {
    setSwipeEnabled(value);
    localStorage.setItem('swipeEnabled', value.toString());
  }

  function handleMessMenuViewChange(value) {
    setDefaultMessMenuView(value);
    localStorage.setItem('defaultMessMenuView', value);
  }

  function handleTargetAttendanceChange(e) {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && value >= 0 && value <= 100)) {
      setAttendanceGoal(value === '' ? '' : parseInt(value));
    }
  }

  function handleLogout() {
    setOpen(false);
    if (typeof onLogout === 'function') onLogout();
  }

  return (
    <Dialog open={open} onOpenChange={(val) => setOpen(val)}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="p-2 rounded-full focus:outline-none focus:ring-2 transition-colors duration-300 ease-in-out text-muted-foreground hover:bg-accent/50"
        >
          <Settings className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border border-border text-foreground p-6 rounded-lg w-[calc(100vw-2rem)] max-w-md mx-auto shadow-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">Manage preferences such as theme, default tabs, and cache settings.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium text-foreground">Theme Presets</Label>
              <Select value={selectedPresetId} onValueChange={(id) => {
                const preset = themePresets.find(p => p.id === id);
                if (preset) {
                  applyThemePreset(preset);
                }
              }}>
                <SelectTrigger className="w-full bg-muted text-foreground border border-border">
                  <SelectValue placeholder="Select a theme preset" />
                </SelectTrigger>
                <SelectContent className="bg-muted border border-border max-h-96">
                  {themePresets.map((preset) => (
                    <SelectItem
                      key={preset.id}
                      value={preset.id}
                      className="text-foreground hover:bg-accent/50 focus:bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div
                            className="w-4 h-4 rounded border border-border"
                            style={{ backgroundColor: preset.primary }}
                            title="Primary Color"
                          />
                          <div
                            className="w-4 h-4 rounded border border-border"
                            style={{ backgroundColor: preset.secondary }}
                            title="Secondary Color"
                          />
                          <div
                            className="w-4 h-4 rounded border border-border"
                            style={{ backgroundColor: preset.background }}
                            title="Background"
                          />
                        </div>
                        <span>{preset.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="block sm:hidden grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium text-foreground">Show timetable in navbar</Label>
              <div className="flex items-center">
                <Switch checked={showTimetableInNavbar} onCheckedChange={(val) => {
                  setShowTimetableInNavbar(val);
                  try { localStorage.setItem('showTimetableInNavbar', val ? 'true' : 'false'); } catch (e) {}
                  try { window.dispatchEvent(new CustomEvent('jp:settingsChange', { detail: { showTimetableInNavbar: val } })); } catch (e) {}
                }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium text-foreground">Default tab on login</Label>
              <Select value={defaultTab} onValueChange={handleDefaultTabChange}>
                <SelectTrigger className="w-full bg-muted text-foreground border border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border border-border">
                  {TABS.map((t) => (
                    <SelectItem
                      key={t.key}
                      value={t.key}
                      className="text-foreground hover:bg-accent/50 focus:bg-accent/50"
                    >
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium text-foreground">Enable swipe navigation</Label>
              <Switch
                checked={swipeEnabled}
                onCheckedChange={handleSwipeEnabledChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-start">
              <Label className="text-sm font-medium text-foreground pt-2">Default mess menu view</Label>
              <RadioGroup value={defaultMessMenuView} onValueChange={handleMessMenuViewChange} className="flex flex-col gap-2">
                {MESS_MENU_VIEWS.map((view) => (
                  <div key={view.key} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={view.key}
                      id={`mess-view-${view.key}`}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <Label
                      htmlFor={`mess-view-${view.key}`}
                      className="text-sm font-normal text-foreground cursor-pointer"
                    >
                      {view.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium text-foreground">
                Target attendance %
              </Label>
              <Input
                type="number"
                value={attendanceGoal}
                onChange={handleTargetAttendanceChange}
                min="0"
                max="100"
                className="w-full bg-muted text-foreground border border-border"
                placeholder="75"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium text-foreground">Clear all cached data</Label>
              <Button
                variant="destructive"
                onClick={handleClearCache}
                className="w-full flex items-center justify-center gap-2 bg-destructive text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Cache
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-0">
          {(() => {
            const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
            const name = profileData?.studentname || 'User';
            const image = profileData?.imagepath;

            return (
              <div className="relative mx-4 -mb-2 pt-4 pb-6 px-4 bg-card rounded-t-lg border-x border-t border-border flex items-center gap-4 z-0 shadow-sm">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
                  {image ? (
                    <img src={`data:image/jpeg;base64,${image}`} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                      {name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="text-base font-semibold text-foreground truncate">{name}</h3>
              </div>
            );
          })()}

          <div className="border-t border-border mx-4"></div>

          <div className="px-4 space-y-3">
            <ul className="flex justify-center mb-2">
              <InstallPWA />
            </ul>

            <Button
              onClick={handleLogout}
              variant="destructive"
              className="relative z-10 w-full bg-destructive text-destructive-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              className="w-full bg-transparent text-muted-foreground border border-border hover:bg-accent/50 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
