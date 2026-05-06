import { useConvexAuth } from "convex/react"
import { Loader2 } from "lucide-react"
import { SignInForm } from "./SignInForm"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <SignInForm />
  }

  return <>{children}</>
}
