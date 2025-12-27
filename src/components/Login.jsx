import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoginError } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.23/dist/jsjiit.esm.js"
import { Lock, User, UtensilsCrossed, Calendar, Heart, Laugh, Eye, EyeOff } from "lucide-react"
import InstallPWA from './InstallPWA'
import MessMenu from "./MessMenu"
import ThemeBtn from "./ui/ThemeBtn"
import { ArtificialWebPortal } from "./scripts/artificialW"

const formSchema = z.object({
  enrollmentNumber: z.string({
    required_error: "Enrollment number is required",
  }),
  password: z.string({
    required_error: "Password is required",
  }),
})

export default function Login({ onLoginSuccess, w }) {
  const [loginStatus, setLoginStatus] = useState({
    isLoading: false,
    error: null,
    credentials: null,
    canFallbackOffline: false,
  })
  const [isFeatureOpen, setIsFeatureOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enrollmentNumber: "",
      password: "",
    },
  })

  useEffect(() => {
    if (!loginStatus.credentials) return

    const performLogin = async () => {
      try {
        const attemptedUsername = loginStatus.credentials.enrollmentNumber
        const attemptedPassword = loginStatus.credentials.password

        await w.student_login(attemptedUsername, attemptedPassword)

        localStorage.setItem("username", attemptedUsername)
        localStorage.setItem("password", attemptedPassword)

        setLoginStatus((prev) => ({
          ...prev,
          isLoading: false,
          credentials: null,
        }))
        onLoginSuccess(w)
      } catch (error) {
        console.error("Login failed:", error)
        const attemptedUsername = loginStatus.credentials?.enrollmentNumber || ''
        const isAuthError = error instanceof LoginError

        const profileData = localStorage.getItem('profileData');
        const attendanceData = Object.keys(localStorage).some(key => key.startsWith('attendance-'));
        const gradesData = Object.keys(localStorage).some(key => key.startsWith('grades-'));
        const hasCache = !!(profileData || attendanceData || gradesData)

        setLoginStatus((prev) => ({
          ...prev,
          isLoading: false,
          error: isAuthError ? error.message : "Login failed. Falling back to offline mode if cached data exists.",
          credentials: null,
          canFallbackOffline: (!isAuthError && hasCache),
        }))

        if (!isAuthError && hasCache) {
          try {
            if (attemptedUsername) localStorage.setItem('username', attemptedUsername)
            const artificialW = new ArtificialWebPortal();
            onLoginSuccess(artificialW);
          } catch (e) {
          }
        }
      }
    }

    setLoginStatus((prev) => ({ ...prev, isLoading: true, canFallbackOffline: false, error: null }))
    performLogin()
  }, [loginStatus.credentials, onLoginSuccess, w])

  useEffect(() => {
    const username = localStorage.getItem("username")
    const password = localStorage.getItem("password")
    if (username && password) {
      form.setValue("enrollmentNumber", username)
      form.setValue("password", password)
      setLoginStatus(prev => ({ ...prev, credentials: { enrollmentNumber: username, password } }))
    }
  }, [])

  function onSubmit(values) {
    setLoginStatus((prev) => ({
      ...prev,
      credentials: values,
      error: null,
      canFallbackOffline: false,
    }))
  }

  const handleOfflineMode = () => {
    const profileData = localStorage.getItem('profileData');
    const attendanceData = Object.keys(localStorage).some(key => key.startsWith('attendance-'));
    const gradesData = Object.keys(localStorage).some(key => key.startsWith('grades-'));

    if (!profileData && !attendanceData && !gradesData) {
      setLoginStatus((prev) => ({
        ...prev,
        error: "No cached data available. Please login online first to use offline mode.",
      }));
      return;
    }
    const artificialW = new ArtificialWebPortal();
    onLoginSuccess(artificialW);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="py-6 px-4 border-b border-border">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tighter text-foreground">Modern JIIT WebKiosk</h1>
          <ThemeBtn />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center gap-12">
        <div className="hidden md:flex justify-center mb-4">
          <img src="/pwa-icons/wheel.svg" alt="JP Portal Logo" className="w-16 h-16 rounded-lg shadow-lg" />
        </div>
        <ul className="flex justify-center mb-4">
          <InstallPWA />
        </ul>
        <div className="w-full max-w-md">
          <div className="bg-card backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-border">
            <h2 className="text-2xl font-bold mb-6 text-card-foreground">Login to Your WebKiosk  Account</h2>
            {loginStatus.error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{loginStatus.error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="enrollmentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Enrollment Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter enrollment number"
                            className="bg-card border-input text-foreground pl-10"
                            {...field}
                          />
                          <User
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                            size={18}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            className="bg-card border-input text-foreground pl-10 pr-10"
                            {...field}
                          />
                          <Lock
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                            size={18}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  disabled={loginStatus.isLoading}
                >
                  {loginStatus.isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </Form>
            <div className="mt-6 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 text-muted-foreground bg-background">Or continue without login</span>
                </div>
              </div>
              <div className="flex justify-center gap-2">
                {loginStatus.canFallbackOffline && (
                  <button
                    onClick={handleOfflineMode}
                    className="flex items-center justify-center px-6 py-2 bg-orange-600/20 dark:bg-orange-100 border border-orange-500/30 dark:border-orange-300 text-orange-400 dark:text-orange-700 hover:bg-orange-700/40 dark:hover:bg-orange-50 hover:text-orange-200 dark:hover:text-orange-600 transition-colors rounded-lg text-sm font-medium gap-2"
                  >
                    <Smartphone size={18} /> Offline Mode
                  </button>
                )}
                <MessMenu>
                  <button className="flex items-center justify-center px-6 py-2 bg-green-600/20 dark:bg-green-100 border border-green-500/30 dark:border-green-300 text-green-400 dark:text-green-700 hover:bg-green-700/40 dark:hover:bg-green-50 hover:text-green-200 dark:hover:text-green-600 transition-colors rounded-lg text-sm font-medium gap-2">
                    <UtensilsCrossed size={18} /> Mess Menu
                  </button>
                </MessMenu>
                <a
                  href="#/academic-calendar"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = '#/academic-calendar';
                  }}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600/20 dark:bg-blue-100 border border-blue-500/30 dark:border-blue-300 text-blue-400 dark:text-blue-700 hover:bg-blue-700/40 dark:hover:bg-blue-50 hover:text-blue-200 dark:hover:text-blue-600 transition-colors rounded-lg text-sm font-medium gap-2"
                >
                  <Calendar size={18} /> Academic Calendar
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-muted-foreground">
        <p className="flex items-center justify-center gap-1">
          Created with <Heart className="w-4 h-4 text-red-400" /> for JIIT students only
        </p>
        <p className="text-sm mt-2 flex items-center justify-center gap-1">
          Not liable for attendance-related emotional damage <Laugh className="w-4 h-4" />
        </p>
      </footer>
    </div>
  )
}

