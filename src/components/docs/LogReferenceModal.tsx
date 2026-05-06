// Log reference modal — opens when an operator log code is clicked anywhere
// in DOCS. The log itself is owned by the Oppr LOGS module; here we just
// surface the reference and a CTA that would deep-link into LOGS in a
// real deployment.

import type { AssetLog } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText } from "lucide-react"
import { toast } from "sonner"

export function LogReferenceModal({
  log,
  open,
  onOpenChange,
}: {
  log: AssetLog | null
  open: boolean
  onOpenChange: (next: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {log ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="font-mono text-sm font-bold">
                  {log.code}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-foreground">
                  {log.name}
                </DialogDescription>
                {log.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {log.description}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm">
              View this log within{" "}
              <span className="font-semibold">Oppr LOGS</span>.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  toast.info(
                    "Oppr LOGS is a separate module and is not bundled in this showcase build.",
                  )
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in Oppr LOGS
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
