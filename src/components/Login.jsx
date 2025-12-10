import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoginError } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.23/dist/jsjiit.esm.js"
import { Lock, User, UtensilsCrossed, Calendar, Heart, Laugh, Eye, EyeOff, Smartphone } from "lucide-react"
import MessMenu from "./MessMenu"
import ThemeBtn from "./ui/ThemeBtn"

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
  })
  const [isFeatureOpen, setIsFeatureOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
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
        await w.student_login(loginStatus.credentials.enrollmentNumber, loginStatus.credentials.password)

        localStorage.setItem("username", loginStatus.credentials.enrollmentNumber)
        localStorage.setItem("password", loginStatus.credentials.password)

        setLoginStatus((prev) => ({
          ...prev,
          isLoading: false,
          credentials: null,
        }))
        onLoginSuccess()
      } catch (error) {
        console.error("Login failed:", error)
        setLoginStatus((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof LoginError ? error.message : "Login failed. Please check your credentials.",
          credentials: null,
        }))
      }
    }

    setLoginStatus((prev) => ({ ...prev, isLoading: true }))
    performLogin()
  }, [loginStatus.credentials, onLoginSuccess, w])

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  useEffect(() => {
    const handler = () => setShowInstall(false)
    window.addEventListener("appinstalled", handler)
    return () => window.removeEventListener("appinstalled", handler)
  }, [])

  useEffect(() => {
    const username = localStorage.getItem("username")
    const password = localStorage.getItem("password")
    if (username && password) {
      form.setValue("enrollmentNumber", username)
      form.setValue("password", password)
      setLoginStatus(prev => ({ ...prev, credentials: { enrollmentNumber: username, password } }))
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShowInstall(false)
    }
    setDeferredPrompt(null)
  }

  function onSubmit(values) {
    setLoginStatus((prev) => ({
      ...prev,
      credentials: values,
      error: null,
    }))
  }

  return (
    <div className="min-h-screen bg-black dark:bg-white text-white dark:text-black flex flex-col">
      <header className="py-6 px-4 border-b border-white/10 dark:border-gray-300">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tighter text-white dark:text-black">Modern JIIT WebKiosk</h1>
          <ThemeBtn />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center gap-12">
        {showInstall && (
          <>
            <div className="hidden md:flex justify-center mb-4">
              <img src="/pwa-icons/wheel.svg" alt="JP Portal Logo" className="w-16 h-16 rounded-lg shadow-lg" />
            </div>
            <div className="w-full max-w-md mb-4">
              <button
                onClick={handleInstallClick}
                className="w-full bg-[#0B0D0D] border border-white/20 text-white py-2 rounded-lg font-semibold hover:bg-[#1A1A1D] transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Install as an App
              </button>
            </div>
          </>
        )}
        <div className="w-full max-w-md">
          <div className="bg-white/5 dark:bg-gray-100 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/10 dark:border-gray-300">
            <h2 className="text-2xl font-bold mb-6">Login to Your WebKiosk  Account</h2>
            {loginStatus.error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
                {loginStatus.error}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="enrollmentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80 dark:text-gray-700">Enrollment Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter enrollment number"
                            className="bg-white/5 dark:bg-gray-100 border-white/10 dark:border-gray-300 text-white dark:text-black pl-10"
                            {...field}
                          />
                          <User
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 dark:text-gray-500"
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
                      <FormLabel className="text-white/80 dark:text-gray-700">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            className="bg-white/5 dark:bg-gray-100 border-white/10 dark:border-gray-300 text-white dark:text-black pl-10 pr-10"
                            {...field}
                          />
                          <Lock
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 dark:text-gray-500"
                            size={18}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 dark:text-gray-500 hover:text-white/60 dark:hover:text-gray-700"
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
                  className="w-full bg-white dark:bg-black text-black dark:text-white hover:bg-white/90 dark:hover:bg-gray-900 transition-colors"
                  disabled={loginStatus.isLoading}
                >
                  {loginStatus.isLoading ? "Signing in..." : "Sign In"}
                </Button>              </form>
            </Form>
            <div className="mt-6 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 text-white/60 dark:text-gray-600 bg-[#0D0D0D] dark:bg-[#F3F4F6]">Or continue without login</span>
                </div>
              </div>
              <div className="flex justify-center gap-2">
                <MessMenu>
                  <button className="flex items-center justify-center px-6 py-2 bg-green-600/20 dark:bg-green-100 border border-green-500/30 dark:border-green-300 text-green-400 dark:text-green-700 hover:bg-green-700/40 dark:hover:bg-green-50 hover:text-green-200 dark:hover:text-green-600 transition-colors rounded-lg text-sm font-medium gap-2">
                    <UtensilsCrossed size={18} /> Mess Menu
                  </button>
                </MessMenu>
                <a href="#/academic-calendar" className="flex items-center justify-center px-4 py-2 bg-blue-600/20 dark:bg-blue-100 border border-blue-500/30 dark:border-blue-300 text-blue-400 dark:text-blue-700 hover:bg-blue-700/40 dark:hover:bg-blue-50 hover:text-blue-200 dark:hover:text-blue-600 transition-colors rounded-lg text-sm font-medium gap-2">
                  <Calendar size={18} /> Academic Calendar
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-white/40 dark:text-gray-500">
        <p className="flex items-center justify-center gap-1">
          Created with <Heart className="w-4 h-4 text-red-400 dark:text-red-500" /> for JIIT students only
        </p>
        <p className="text-sm mt-2 flex items-center justify-center gap-1">
          Not liable for attendance-related emotional damage <Laugh className="w-4 h-4" />
        </p>
      </footer>
    </div>
  )
}

