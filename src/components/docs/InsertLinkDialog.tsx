// Insert / edit link dialog. Replaces the legacy window.prompt flow.
//
// Two fields: URL + display text. One toggle: "Open in new tab". Unlink
// button when an existing link is being edited. Accepts a naming code
// (HOL-OPS-SOP-0001) and resolves to /docs/<id> via api.documents.byNaming.

import { useEffect, useState } from "react"
import { LinkIcon, Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface InsertLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Selected text from the editor — used as default display text. */
  initialText?: string
  /** When set, the dialog is editing an existing link. */
  initialUrl?: string | null
  initialOpenInNewTab?: boolean
  onInsert: (args: { url: string; text: string; openInNewTab: boolean }) => void
  onUnlink?: () => void
}

const NAMING_CODE_PATTERN = /^[A-Z]{2,5}-[A-Z]{2,5}-[A-Z]{2,5}-\d{3,4}$/

export function InsertLinkDialog({
  open,
  onOpenChange,
  initialText,
  initialUrl,
  initialOpenInNewTab,
  onInsert,
  onUnlink,
}: InsertLinkDialogProps) {
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [openInNewTab, setOpenInNewTab] = useState(true)

  useEffect(() => {
    if (open) {
      setUrl(initialUrl ?? "")
      setText(initialText ?? "")
      setOpenInNewTab(initialOpenInNewTab ?? true)
    }
  }, [open, initialUrl, initialText, initialOpenInNewTab])

  const isEditing = Boolean(initialUrl)
  const trimmedUrl = url.trim()
  const looksLikeNamingCode = NAMING_CODE_PATTERN.test(trimmedUrl)
  const looksLikeUrl = /^https?:\/\//i.test(trimmedUrl) || /^\//.test(trimmedUrl)
  const valid = trimmedUrl.length > 0 && (looksLikeUrl || looksLikeNamingCode)

  function handleInsert() {
    if (!valid) return
    onInsert({
      url: trimmedUrl,
      text: text.trim() || trimmedUrl,
      openInNewTab,
    })
    onOpenChange(false)
  }

  function handleUnlink() {
    onUnlink?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            {isEditing ? "Edit link" : "Insert link"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Paste a URL or another document's naming code (e.g.{" "}
            <code>HOL-OPS-SOP-0001</code>).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="link-url" className="text-xs">
              URL or naming code
            </Label>
            <Input
              id="link-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… or HOL-OPS-SOP-0001"
              autoFocus
            />
            {trimmedUrl && !valid && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Add <code>https://</code> for external URLs, or use a
                naming code like <code>HOL-OPS-SOP-0001</code>.
              </p>
            )}
            {looksLikeNamingCode && (
              <p className="text-[11px] text-muted-foreground">
                Resolves to the document's read view.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link-text" className="text-xs">
              Display text (optional)
            </Label>
            <Input
              id="link-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={trimmedUrl || "Same as URL"}
            />
          </div>

          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={openInNewTab}
              onCheckedChange={(v) => setOpenInNewTab(v === true)}
            />
            Open in a new tab
          </label>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {isEditing && onUnlink ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnlink}
              className="text-destructive"
            >
              <Unlink className="mr-1.5 h-3.5 w-3.5" />
              Unlink
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleInsert} disabled={!valid}>
              {isEditing ? "Update" : "Insert"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
