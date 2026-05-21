import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoginError } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.26/dist/jsjiit.esm.js"
import { showErrorToast, showSuccessToast, showWarningToast, showLoadingToast, updateToastError, updateToastSuccess } from '@/lib/toastUtils'
import { Lock, User, UtensilsCrossed, Calendar, Heart, Laugh, Eye, EyeOff, Smartphone } from "lucide-react"
import InstallPWA from './InstallPWA'
import MessMenu from "./MessMenu"
import ThemeBtn from "./ui/ThemeBtn"
import { ArtificialWebPortal } from "./scripts/artificialW"
import { setCredentials, setUsername, getUsername, getPassword, hasCachedProfile, hasAnyAttendance, hasAnyGrades } from '@/components/scripts/cache' 

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
  const [hasCache, setHasCache] = useState(false)
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

    const toastId = showLoadingToast("Logging in...", "Please wait while we sign you in.")

    const performLogin = async () => {
      try {
        const attemptedUsername = loginStatus.credentials.enrollmentNumber
        const attemptedPassword = loginStatus.credentials.password

        await w.student_login(attemptedUsername, attemptedPassword)

        setCredentials(attemptedUsername, attemptedPassword)

        setLoginStatus((prev) => ({
          ...prev,
          isLoading: false,
          credentials: null,
        }))
        updateToastSuccess(toastId, "Login successful", "Welcome back!")
        onLoginSuccess(w)
      } catch (error) {
        console.error("Login failed:", error)
        const attemptedUsername = loginStatus.credentials?.enrollmentNumber || ''
        const isAuthError = error instanceof LoginError

        const hasCache = hasCachedProfile() || hasAnyAttendance() || hasAnyGrades();

        setLoginStatus((prev) => ({
          ...prev,
          isLoading: false,
          error: isAuthError ? error.message : "Login failed. Falling back to offline mode if cached data exists.",
          credentials: null,
          canFallbackOffline: (!isAuthError && hasCache),
        }))

        if (isAuthError) {
          updateToastError(toastId, "Login failed", error.message || "Please check your enrollment number and password.")
          showErrorToast("Login Failed", error.message || "Please check your credentials.")
        } else if (hasCache) {
          updateToastError(toastId, "Offline mode enabled", "Using cached data for offline access.")
          showWarningToast("Offline Mode", "Login failed. Using cached data for offline access.")
        } else {
          updateToastError(toastId, "Login failed", error.message || "Unable to login.")
          showErrorToast("Login Failed", error.message || "Unable to login. Please try again.")
        }

        if (!isAuthError && hasCache) {
          try {
            if (attemptedUsername) setUsername(attemptedUsername)
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
    setHasCache(hasCachedProfile() || hasAnyAttendance() || hasAnyGrades())
    const username = getUsername()
    const password = getPassword()
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
    const hasCache = hasCachedProfile() || hasAnyAttendance() || hasAnyGrades();

    if (!hasCache) {
      showErrorToast("Offline unavailable", "No cached data available. Please login online first to use offline mode.")
      setLoginStatus((prev) => ({
        ...prev,
        error: "No cached data available. Please login online first to use offline mode.",
      }));
      return;
    }
    showSuccessToast("Offline mode enabled", "Using cached data for offline access.")
    const artificialW = new ArtificialWebPortal();
    onLoginSuccess(artificialW);
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col">
      <header className="py-3 px-4 border-b border-border">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Modern JIIT WebKiosk</h1>
          <ThemeBtn />
        </div>
      </header>

      <main className="flex-1 min-h-0 container mx-auto px-4 pt-2 pb-2 flex flex-col items-center justify-start gap-0">
        <div className="w-full flex flex-col items-center justify-center gap-0 md:flex-row md:items-stretch md:justify-center md:gap-6 xl:max-w-6xl">
          <div className="hidden md:flex md:w-[320px] flex-col items-center gap-6 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-xl">
            <img src="https://cdn.jsdelivr.net/gh/J2V-k/jportal-vhost@main/public/pwa-icons/wheel.svg" alt="JP Portal Logo" className="w-20 h-20 rounded-2xl shadow-lg" />
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-card-foreground">JP Portal</h2>
            </div>
            <div className="w-full">
              <InstallPWA />
            </div>
          </div>
          <div className="w-full flex justify-center mb-0 lg:hidden">
            <div className="w-full max-w-[320px]">
              <InstallPWA />
            </div>
          </div>
          <div className="w-full min-h-0 md:flex-1">
            <div className="bg-card backdrop-blur-sm rounded-xl shadow-xl border border-border min-h-0 overflow-hidden">
              <div className="flex flex-col gap-3 p-4 md:p-5 max-h-[calc(100vh-96px)] overflow-y-auto">
              <div className="space-y-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-card-foreground">Welcome back to WebKiosk</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sign in with your enrollment number and password to access attendance, grades, timetable, and more.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/80 p-3 text-sm text-muted-foreground">
                  {hasCache ? (
                    <p className="font-medium text-foreground">Cached data is available for offline use.</p>
                  ) : (
                    <p className="font-medium text-foreground">No offline cache detected yet. Sign in once to unlock offline access.</p>
                  )}
                </div>
              </div>

              {loginStatus.error && (
              <Alert variant="destructive" className="mb-4" role="alert">
                <AlertDescription>{loginStatus.error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
            <div className="mt-5 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 text-muted-foreground bg-background">Or continue without login</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-2">
                <button
                  onClick={handleOfflineMode}
                  disabled={loginStatus.isLoading || !hasCache}
                  className={`flex items-center justify-center px-5 py-2 rounded-lg text-sm font-medium gap-2 transition-colors ${
                    hasCache
                      ? "bg-orange-600/20 dark:bg-orange-100 border border-orange-500/30 dark:border-orange-300 text-foreground hover:bg-orange-700/40 dark:hover:bg-orange-50 hover:text-foreground"
                      : "bg-muted/80 border border-border text-muted-foreground cursor-not-allowed opacity-70"
                  }`}
                  title={hasCache ? "Continue with cached data" : "Login once to enable offline mode"}
                >
                  <Smartphone size={18} /> Offline Mode
                </button>
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
      </div>
    </div>
      </main>

      <footer className="py-3 text-center text-muted-foreground text-xs sm:text-sm">
        <p className="flex flex-wrap items-center justify-center gap-1">
          Created with <Heart className="w-4 h-4 text-red-400" /> for JIIT students only
        </p>
        <p className="mt-1 flex flex-wrap items-center justify-center gap-1">
          Not liable for attendance-related emotional damage <Laugh className="w-4 h-4" />
        </p>
      </footer>
    </div>
  )
}