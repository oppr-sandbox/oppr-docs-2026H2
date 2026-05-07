import { useQuery } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { LogOut, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "../../../convex/_generated/api"

// Role is a UI stub for now — every signed-in user is treated as Author.
// When a `role` field is added to user records, swap the constant for
// `me?.role`. Surfaced as a chip so the seam is visible in the demo.
const STUB_ROLE = "Author" as const

export function UserMenu() {
  const me = useQuery(api.users.me)
  const { signOut } = useAuthActions()

  const email = me?.email ?? ""
  const initial = email.slice(0, 1).toUpperCase() || "?"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-2 px-2"
          aria-label="User menu"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
            {initial}
          </span>
          <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
            {STUB_ROLE}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{email || "Signed in"}</div>
            <div className="text-[10px] text-muted-foreground">
              Role: {STUB_ROLE}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
