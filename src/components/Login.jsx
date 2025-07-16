import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoginError } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.20/dist/jsjiit.esm.js"
import { Lock, User, UtensilsCrossed, Calendar } from "lucide-react"
import MessMenu from "./MessMenu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

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

        console.log("Login successful")
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="py-6 px-4 border-b border-white/10">
        <div className="container mx-auto flex items-center justify-center">
          <h1 className="text-3xl font-bold tracking-tighter">JPortal -{">"} Modern JIIT WebKiosk</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center gap-12">
        {showInstall && (
          <div className="w-full max-w-md mb-4">
            <button
              onClick={handleInstallClick}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
            >
              Install JPortal App
            </button>
          </div>
        )}
        <div className="w-full max-w-md">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/10">
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
                      <FormLabel className="text-white/80">Enrollment Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter enrollment number"
                            className="bg-white/5 border-white/10 text-white pl-10"
                            {...field}
                          />
                          <User
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40"
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
                      <FormLabel className="text-white/80">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="password"
                            placeholder="Enter password"
                            className="bg-white/5 border-white/10 text-white pl-10"
                            {...field}
                          />
                          <Lock
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40"
                            size={18}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-white text-black hover:bg-white/90 transition-colors"
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
                  <span className="bg-black px-2 text-white/60">Or continue without login</span>
                </div>
              </div>
              <div className="flex justify-center gap-2">
                <MessMenu>
                  <button className="flex items-center justify-center px-6 py-2 bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 hover:text-green-300 transition-colors rounded-lg text-sm font-medium gap-2">
                    <UtensilsCrossed size={18} /> Mess Menu
                  </button>
                </MessMenu>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-white/40">
        <p>Created with ❤️ for JIIT students only</p>
        <p className="text-sm mt-2">Not liable for attendance-related emotional damage 😅</p>
      </footer>
    </div>
  )
}

