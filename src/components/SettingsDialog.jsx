import { useState, useEffect } from 'react';
import useTheme from '../context/ThemeContext';
import { applyTheme, saveTheme, getAllThemePresets } from '@/lib/theme';
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
import { Settings, LogOut, Trash2, X } from 'lucide-react';
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
  const { themeMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(() => localStorage.getItem('defaultTheme') || 'light');
  const [defaultTab, setDefaultTab] = useState(() => localStorage.getItem('defaultTab') || 'auto');
  const [swipeEnabled, setSwipeEnabled] = useState(() => localStorage.getItem('swipeEnabled') !== 'false');
  const [defaultMessMenuView, setDefaultMessMenuView] = useState(() => localStorage.getItem('defaultMessMenuView') || 'daily');
  const [themePresets, setThemePresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState(() => {
    const saved = localStorage.getItem('jp-theme');
    if (saved) {
      try {
        return JSON.parse(saved).id || '';
      } catch (e) {
        return '';
      }
    }
    return '';
  });
  const [showTimetableInNavbar, setShowTimetableInNavbar] = useState(() => localStorage.getItem('showTimetableInNavbar') === 'true');

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const data = await getAllThemePresets();
        if (data && typeof data === 'object') {
          setThemePresets(Object.values(data).flat());
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadPresets();
  }, []);

  useEffect(() => {
    setSelectedTheme(themeMode);
  }, [themeMode]);

  function applyThemePreset(preset) {
    applyTheme(preset);
    saveTheme(preset);
    setSelectedPresetId(preset.id);
    localStorage.setItem('selectedPreset', preset.id);
  }

  function handleClearCache() {
    if (!confirm('Are you sure you want to clear ALL cached data?')) return;
    localStorage.clear();
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

  const profileData = JSON.parse(localStorage.getItem('profileData') || '{}');
  const studentName = profileData?.studentname || 'User';
  const studentImage = profileData?.imagepath;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="p-2 rounded-full transition-colors text-muted-foreground hover:bg-accent/50"
        >
          <Settings className="w-6 h-6" />
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 bg-card border border-border text-foreground flex flex-col w-[calc(100vw-2rem)] max-w-md mx-auto shadow-2xl h-[85vh] overflow-hidden rounded-lg">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Manage preferences such as theme, default tabs, and cache settings.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 scrollbar-hide">
          <div className="space-y-6">
            
            <InstallPWA />

            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium">Theme Presets</Label>
              <Select value={selectedPresetId} onValueChange={(id) => {
                const preset = themePresets.find(p => p.id === id);
                if (preset) applyThemePreset(preset);
              }}>
                <SelectTrigger className="w-full bg-muted border-border">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {themePresets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-border" 
                          style={{ backgroundColor: preset.primary }} 
                        />
                        <span>{preset.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center sm:hidden">
              <Label className="text-sm font-medium">Show timetable in navbar</Label>
              <Switch checked={showTimetableInNavbar} onCheckedChange={(val) => {
                setShowTimetableInNavbar(val);
                localStorage.setItem('showTimetableInNavbar', val ? 'true' : 'false');
                window.dispatchEvent(new CustomEvent('jp:settingsChange', { detail: { showTimetableInNavbar: val } }));
              }} />
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium">Default tab on login</Label>
              <Select value={defaultTab} onValueChange={handleDefaultTabChange}>
                <SelectTrigger className="w-full bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TABS.map((t) => (
                    <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium">Enable swipe navigation</Label>
              <Switch checked={swipeEnabled} onCheckedChange={handleSwipeEnabledChange} />
            </div>

            <div className="grid grid-cols-2 gap-4 items-start">
              <Label className="text-sm font-medium pt-1">Default mess menu</Label>
              <RadioGroup value={defaultMessMenuView} onValueChange={handleMessMenuViewChange} className="space-y-2">
                {MESS_MENU_VIEWS.map((view) => (
                  <div key={view.key} className="flex items-center space-x-2">
                    <RadioGroupItem value={view.key} id={`view-${view.key}`} />
                    <Label htmlFor={`view-${view.key}`} className="text-sm font-normal cursor-pointer">
                      {view.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium">Target attendance %</Label>
              <Input
                type="number"
                value={attendanceGoal}
                onChange={handleTargetAttendanceChange}
                className="bg-muted border-border text-center"
                placeholder="75"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium">Cache Storage</Label>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearCache}
                className="w-full gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cache
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shrink-0">
                {studentImage ? (
                  <img src={`data:image/jpeg;base64,${studentImage}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                    {studentName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Logged in as</p>
                <h3 className="text-sm font-bold truncate">{studentName}</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 shrink-0 border-t bg-card grid grid-cols-2 gap-3">
          <Button onClick={handleLogout} variant="destructive" className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
          <Button onClick={() => setOpen(false)} variant="outline" className="w-full">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}