import { useState } from "react"
import { useAuthActions } from "@convex-dev/auth/react"
import { Mail, ShieldCheck } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string }

export function SignInForm() {
  const { signIn } = useAuthActions()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>({ kind: "idle" })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    setStatus({ kind: "submitting" })
    try {
      await signIn("resend", { email: trimmed })
      setStatus({ kind: "sent", email: trimmed })
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error
            ? err.message
            : "Could not send the magic link. Try again.",
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-base font-semibold">Sign in to Oppr DOCS</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Access is restricted to <code>@oppr.ai</code> employees. We&apos;ll
            send a magic link to your work email.
          </p>

          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Work email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@oppr.ai"
                required
                autoComplete="email"
                disabled={
                  status.kind === "submitting" || status.kind === "sent"
                }
                className="h-9 text-sm"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="w-full gap-1.5"
              disabled={
                status.kind === "submitting" || status.kind === "sent"
              }
            >
              <Mail className="h-3.5 w-3.5" />
              {status.kind === "submitting"
                ? "Sending..."
                : "Send magic link"}
            </Button>
          </form>

          {status.kind === "sent" && (
            <Alert className="border-emerald-500/30 bg-emerald-500/5">
              <AlertTitle className="text-emerald-700 dark:text-emerald-300">
                Magic link sent
              </AlertTitle>
              <AlertDescription className="text-xs">
                Check <code>{status.email}</code>. Click the link to finish
                signing in.
              </AlertDescription>
            </Alert>
          )}

          {status.kind === "error" && (
            <Alert variant="destructive">
              <AlertTitle>Couldn&apos;t send the link</AlertTitle>
              <AlertDescription className="text-xs">
                {status.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
