import { useState, useEffect } from 'react';
import useTheme from '../context/ThemeContext';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Settings, LogOut, Trash2, Sun, Moon, X, Smartphone } from 'lucide-react';

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

  useEffect(() => {
    setSelectedTheme(themeMode);
  }, [themeMode]);



  function applyTheme(theme) {
    if (theme === 'dark') {
      darkTheme();
    } else {
      lightTheme();
    }
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
          className="p-2 rounded-full focus:outline-none focus:ring-2 transition-colors duration-300 ease-in-out dark:text-gray-700 dark:hover:bg-gray-200 text-gray-300 hover:text-gray-400 hover:bg-[#0A0A0C]"
        >
          <Settings className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="dark:bg-gray-50 bg-[#0B0D0D] border border-gray-800 dark:border-gray-200 text-white dark:text-black p-6 rounded-lg w-[calc(100vw-2rem)] max-w-md mx-auto shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white dark:text-black flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium text-white dark:text-black">Default theme</Label>
              <Tabs value={selectedTheme} onValueChange={handleThemeChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#0D0D0D] dark:bg-gray-50 border border-gray-700 dark:border-gray-300">
                  <TabsTrigger 
                    value="dark" 
                    className="text-gray-300 dark:text-gray-700 data-[state=active]:text-black data-[state=active]:bg-white dark:data-[state=active]:text-white dark:data-[state=active]:bg-black flex items-center gap-1"
                  >
                    <Sun className="w-3 h-3" />
                    Light
                  </TabsTrigger>
                  <TabsTrigger 
                    value="light" 
                    className="text-gray-300 dark:text-gray-700 data-[state=active]:text-black data-[state=active]:bg-white dark:data-[state=active]:text-white dark:data-[state=active]:bg-black flex items-center gap-1"
                  >
                    <Moon className="w-3 h-3" />
                    Dark
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium text-white dark:text-black">Default tab on login</Label>
              <Select value={defaultTab} onValueChange={handleDefaultTabChange}>
                <SelectTrigger className="w-full bg-[#0D0D0D] dark:bg-gray-50 text-white dark:text-black border-gray-700 dark:border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0D0D0D] dark:bg-gray-50 border-gray-700 dark:border-gray-300">
                  {TABS.map((t) => (
                    <SelectItem 
                      key={t.key} 
                      value={t.key}
                      className="text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:bg-gray-800 dark:focus:bg-gray-200"
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
                onCheckedChange={handleSwipeEnabledChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium text-white dark:text-black">Default mess menu view</Label>
              <Select value={defaultMessMenuView} onValueChange={handleMessMenuViewChange}>
                <SelectTrigger className="w-full bg-[#0D0D0D] dark:bg-gray-50 text-white dark:text-black border-gray-700 dark:border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0D0D0D] dark:bg-gray-50 border-gray-700 dark:border-gray-300">
                  {MESS_MENU_VIEWS.map((view) => (
                    <SelectItem 
                      key={view.key} 
                      value={view.key}
                      className="text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 focus:bg-gray-800 dark:focus:bg-gray-200"
                    >
                      {view.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium text-white dark:text-black">
                Target attendance %
              </Label>
              <Input
                type="number"
                value={attendanceGoal}
                onChange={handleTargetAttendanceChange}
                min="0"
                max="100"
                className="w-full bg-[#0D0D0D] dark:bg-gray-50 text-white dark:text-black border-gray-700 dark:border-gray-300"
                placeholder="75"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-sm font-medium text-white dark:text-black">Clear all cached data</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                className="bg-transparent text-gray-300 dark:text-gray-700 border-gray-600 dark:border-gray-300 hover:bg-red-600 hover:text-white hover:border-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Cache
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
              <div className="relative mx-4 -mb-2 pt-4 pb-6 px-4 bg-[#0D0D0D] dark:bg-gray-100 rounded-t-lg border-x border-t border-gray-800 dark:border-gray-300 flex items-center gap-4 z-0 shadow-sm">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700 dark:border-gray-300 flex-shrink-0">
                  {image ? (
                    <img src={`data:image/jpeg;base64,${image}`} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-800 dark:bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-400 dark:text-gray-600">
                      {name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="text-base font-semibold text-white dark:text-black truncate">{name}</h3>
              </div>
            );
          })()}

          <div className="border-t border-gray-700 dark:border-gray-300 mx-4"></div>

          <div className="px-4 space-y-3">
            <Button 
              onClick={handleLogout} 
              variant="destructive"
              className="relative z-10 w-full bg-red-600 hover:bg-red-700 text-white border-red-600 rounded-lg shadow-lg transition-all duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" /> 
              Logout
            </Button>
            <Button 
              onClick={() => setOpen(false)} 
              variant="outline"
              className="w-full bg-transparent text-gray-300 dark:text-gray-700 border-gray-600 dark:border-gray-300 hover:bg-gray-800 dark:hover:bg-gray-200 hover:text-white dark:hover:text-black rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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
