import { useState, useEffect } from 'react';
import useTheme from '../context/ThemeContext';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Settings, LogOut, Trash2 } from 'lucide-react';

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

export default function SettingsDialog({ onLogout }) {
  const { themeMode, darkTheme, lightTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(themeMode || 'light');
  const [defaultTab, setDefaultTab] = useState(() => {
    return localStorage.getItem('defaultTab') || '/attendance';
  });
  const [swipeEnabled, setSwipeEnabled] = useState(() => {
    return localStorage.getItem('swipeEnabled') !== 'false';
  });
  const [defaultMessMenuView, setDefaultMessMenuView] = useState(() => {
    return localStorage.getItem('defaultMessMenuView') || 'daily';
  });

  useEffect(() => {
    const currentTheme = themeMode || localStorage.getItem('theme') || 'light';
    setSelectedTheme(currentTheme);
  }, [themeMode]);

  useEffect(() => {
    if (open) {
      setSwipeEnabled(localStorage.getItem('swipeEnabled') !== 'false');
      setDefaultMessMenuView(localStorage.getItem('defaultMessMenuView') || 'daily');
      setDefaultTab(localStorage.getItem('defaultTab') || '/attendance');
    }
  }, [open]);

  function applyTheme(theme) {
    if (theme === 'dark') {
      darkTheme();
    } else {
      lightTheme();
    }
    localStorage.setItem('theme', theme);
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

  function handleSave() {
    localStorage.setItem('defaultTab', defaultTab);
    localStorage.setItem('swipeEnabled', swipeEnabled.toString());
    localStorage.setItem('defaultMessMenuView', defaultMessMenuView);
    setOpen(false);
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
          className="p-2 rounded-full focus:outline-none focus:ring-2 transition-colors duration-300 ease-in-out dark:text-gray-700 dark:hover:bg-gray-200 text-gray-300 hover:text-gray-400 hover:bg-[#0A0A0C]"
        >
          <Settings className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black dark:bg-white border-2 border-white dark:border-black text-white dark:text-black">
        <DialogHeader>
          <DialogTitle className="text-white dark:text-black">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 items-center">
            <Label className="text-sm font-medium text-white dark:text-black">Default theme</Label>
            <div className="flex gap-2">
              <Button
                variant={selectedTheme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange('light')}
                className={`${
                  selectedTheme === 'light' 
                    ? 'bg-white dark:bg-black text-black dark:text-white border-white dark:border-black' 
                    : 'bg-transparent text-white dark:text-black border-white dark:border-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white'
                }`}
              >
                Light
              </Button>
              <Button
                variant={selectedTheme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleThemeChange('dark')}
                className={`${
                  selectedTheme === 'dark' 
                    ? 'bg-white dark:bg-black text-black dark:text-white border-white dark:border-black' 
                    : 'bg-transparent text-white dark:text-black border-white dark:border-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white'
                }`}
              >
                Dark
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <Label className="text-sm font-medium text-white dark:text-black">Default tab on login</Label>
            <Select value={defaultTab} onValueChange={setDefaultTab}>
              <SelectTrigger className="w-full bg-black dark:bg-white text-white dark:text-black border-2 border-white dark:border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black dark:bg-white border-2 border-white dark:border-black">
                {TABS.map((t) => (
                  <SelectItem 
                    key={t.key} 
                    value={t.key}
                    className="text-white dark:text-black hover:bg-black hover:text-white dark:hover:bg-black dark:hover:text-white focus:bg-black focus:text-white dark:focus:bg-black dark:focus:text-white"
                  >
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <Label className="text-sm font-medium text-white dark:text-black">Enable swipe navigation</Label>
            <Switch 
              checked={swipeEnabled}
              onCheckedChange={setSwipeEnabled}
              className="data-[state=checked]:bg-white dark:data-[state=checked]:bg-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <Label className="text-sm font-medium text-white dark:text-black">Default mess menu view</Label>
            <Select value={defaultMessMenuView} onValueChange={setDefaultMessMenuView}>
              <SelectTrigger className="w-full bg-black dark:bg-white text-white dark:text-black border-2 border-white dark:border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black dark:bg-white border-2 border-white dark:border-black">
                {MESS_MENU_VIEWS.map((view) => (
                  <SelectItem 
                    key={view.key} 
                    value={view.key}
                    className="text-white dark:text-black hover:bg-black hover:text-white dark:hover:bg-black dark:hover:text-white focus:bg-black focus:text-white dark:focus:bg-black dark:focus:text-white"
                  >
                    {view.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <Label className="text-sm font-medium text-white dark:text-black">Clear all cached data</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="bg-transparent text-white dark:text-black border-2 border-white dark:border-black hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white hover:border-red-600 dark:hover:border-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <Button 
            onClick={handleLogout} 
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white border-red-600 w-full"
          >
            <LogOut className="w-4 h-4 mr-2" /> 
            Logout
          </Button>
          <div className="flex gap-2 w-full">
            <DialogClose asChild>
              <Button 
                variant="outline"
                className="bg-transparent text-white dark:text-black border-2 border-white dark:border-black hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white flex-1"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={handleSave}
              className="bg-white dark:bg-black text-black dark:text-white border-2 border-white dark:border-black hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
