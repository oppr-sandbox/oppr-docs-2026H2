// Edit Asset modal — name / id / description / root-asset toggle.
//
// Mirrors the LOGS module's edit dialog. Only the four fields the dialog shows
// are writable; site, QR token, floorplan, and connected log stay read-only at
// v1 (they're managed in LOGS, not DOCS).

import { useEffect, useState } from "react"
import type { Asset } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const DESCRIPTION_LIMIT = 300

export function EditAssetModal({
  asset,
  open,
  onOpenChange,
  onSave,
}: {
  asset: Asset | null
  open: boolean
  onOpenChange: (next: boolean) => void
  onSave: (patch: { name: string; code: string; description: string; level: number }) => void
}) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [isRoot, setIsRoot] = useState(false)

  useEffect(() => {
    if (asset && open) {
      setName(asset.name)
      setCode(asset.code)
      setDescription(asset.description ?? "")
      setIsRoot(asset.level === 0)
    }
  }, [asset, open])

  function handleSave() {
    onSave({
      name: name.trim(),
      code: code.trim(),
      description: description.slice(0, DESCRIPTION_LIMIT),
      level: isRoot ? 0 : 1,
    })
  }

  const charCount = description.length
  const overLimit = charCount > DESCRIPTION_LIMIT

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 sm:rounded-xl">
        <div className="px-7 pb-7 pt-6">
          <DialogTitle className="text-lg font-semibold">Edit Asset</DialogTitle>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-asset-name">Asset Name</Label>
              <Input
                id="edit-asset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-asset-id">Asset ID</Label>
              <Input
                id="edit-asset-id"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-asset-description">Description</Label>
              <Textarea
                id="edit-asset-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-y"
              />
              <div
                className={cn(
                  "text-right text-xs font-medium",
                  overLimit ? "text-destructive" : "text-primary",
                )}
              >
                {charCount}/{DESCRIPTION_LIMIT} characters
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">Root Asset</div>
                  <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
                    Root assets represent entire machines or top-level systems
                    (Level 0). Regular assets are automatically set to Level 1
                    (loggable stations).
                  </p>
                </div>
                <Switch
                  checked={isRoot}
                  onCheckedChange={setIsRoot}
                  aria-label="Mark as root asset"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !code.trim() || overLimit}
              className="bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
