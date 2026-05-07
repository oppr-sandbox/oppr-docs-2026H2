// Insert / paste-URL image dialog. Replaces the legacy window.prompt flow.
//
// Tabs: Upload (browser file → Convex storage → images table) and URL
// (external href → images table with source='url'). Both produce a
// data-image-id that the editor inserts as an <img data-image-id> node.

import { useRef, useState } from "react"
import { Loader2, Upload, Link as LinkIcon, ImageOff } from "lucide-react"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

const MAX_BYTES = 10 * 1024 * 1024

const ACCEPTED_EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp"] as const
const URL_PATTERN = /\.(png|jpe?g|gif|webp|svg)([?#].*)?$/i

interface InsertImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (args: { id: Id<"images">; alt: string }) => void
}

export function InsertImageDialog({
  open,
  onOpenChange,
  onInsert,
}: InsertImageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Insert image</DialogTitle>
          <DialogDescription>
            Upload from your machine, or paste a URL. Either way ends up
            tracked in the image library.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="upload">
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1 gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1 gap-1.5">
              <LinkIcon className="h-3.5 w-3.5" />
              Paste URL
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <UploadTab
              onInsert={(args) => {
                onInsert(args)
                onOpenChange(false)
              }}
            />
          </TabsContent>
          <TabsContent value="url">
            <UrlTab
              onInsert={(args) => {
                onInsert(args)
                onOpenChange(false)
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function UploadTab({
  onInsert,
}: {
  onInsert: (args: { id: Id<"images">; alt: string }) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState("")
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const createFromUpload = useMutation(api.images.createFromUpload)

  function pickFile(f: File | null) {
    if (!f) return
    if (f.size > MAX_BYTES) {
      toast.error(`File too large — ${(f.size / 1024 / 1024).toFixed(1)} MB. Limit is 10 MB.`)
      return
    }
    if (!f.type.startsWith("image/")) {
      toast.error("Not an image file.")
      return
    }
    setFile(f)
  }

  async function handleInsert() {
    if (!file) return
    if (!alt.trim()) {
      toast.error("Alt text is required.")
      return
    }
    setBusy(true)
    try {
      const buf = await file.arrayBuffer()
      const sha256 = await sha256Hex(buf)
      const dims = await probeDimensions(file)

      const uploadUrl = await generateUploadUrl()
      const put = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!put.ok) throw new Error(`Upload failed (${put.status})`)
      const { storageId } = (await put.json()) as { storageId: Id<"_storage"> }

      const result = await createFromUpload({
        storageId,
        filename: file.name,
        contentType: file.type,
        byteSize: file.size,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
        sha256,
        altText: alt.trim(),
      })
      if (result.deduped) {
        toast.success("Image already in the library — reused.")
      } else {
        toast.success("Image uploaded.")
      }
      onInsert({ id: result.id, alt: alt.trim() })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 py-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          pickFile(e.dataTransfer.files?.[0] ?? null)
        }}
        className="flex w-full flex-col items-center gap-1.5 rounded-md border-2 border-dashed bg-muted/20 p-6 text-center transition-colors hover:bg-muted/40"
      >
        <Upload className="h-5 w-5 text-muted-foreground" />
        <div className="text-sm font-medium">
          {file ? file.name : "Drop an image, or click to browse"}
        </div>
        <div className="text-[11px] text-muted-foreground">
          PNG, JPEG, GIF, WebP up to 10 MB
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTS.join(",")}
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Alt text (required)</label>
        <Input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="e.g. Mixer feedstock photo, top view"
        />
        <p className="text-[11px] text-muted-foreground">
          Required for accessibility. Same image used in multiple docs shares
          this alt text.
        </p>
      </div>
      <DialogFooter>
        <Button onClick={handleInsert} disabled={!file || !alt.trim() || busy} size="sm">
          {busy ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Uploading…
            </>
          ) : (
            "Insert"
          )}
        </Button>
      </DialogFooter>
    </div>
  )
}

function UrlTab({
  onInsert,
}: {
  onInsert: (args: { id: Id<"images">; alt: string }) => void
}) {
  const [url, setUrl] = useState("")
  const [alt, setAlt] = useState("")
  const [busy, setBusy] = useState(false)
  const createFromUrl = useMutation(api.images.createFromUrl)

  async function handleInsert() {
    if (!alt.trim()) {
      toast.error("Alt text is required.")
      return
    }
    if (!URL_PATTERN.test(url)) {
      toast.error("URL must end in .png, .jpg, .jpeg, .gif, .webp or .svg")
      return
    }
    setBusy(true)
    try {
      const filename = filenameFromUrl(url)
      const result = await createFromUrl({
        externalUrl: url.trim(),
        filename,
        contentType: contentTypeFromFilename(filename),
        altText: alt.trim(),
      })
      onInsert({ id: result.id, alt: alt.trim() })
      toast.success("Image referenced from URL.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 py-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Image URL</label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium">Alt text (required)</label>
        <Input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Describe the image"
        />
      </div>
      <Alert>
        <ImageOff className="h-4 w-4" />
        <AlertDescription className="text-xs">
          External URLs can rot. Where possible, prefer the Upload tab so the
          image lives in our storage. URL embeds are still tracked in the image
          library.
        </AlertDescription>
      </Alert>
      <DialogFooter>
        <Button
          onClick={handleInsert}
          disabled={!url || !alt.trim() || busy}
          size="sm"
        >
          {busy ? "Inserting…" : "Insert"}
        </Button>
      </DialogFooter>
    </div>
  )
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", buf)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

async function probeDimensions(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const url = URL.createObjectURL(file)
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Could not probe dimensions"))
      img.src = url
    })
    URL.revokeObjectURL(url)
    return { width: img.naturalWidth, height: img.naturalHeight }
  } catch {
    return null
  }
}

function filenameFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const last = u.pathname.split("/").pop()
    if (last && last.includes(".")) return last
    return u.hostname + u.pathname
  } catch {
    return url.slice(0, 60)
  }
}

function contentTypeFromFilename(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? ""
  if (ext === "png") return "image/png"
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "gif") return "image/gif"
  if (ext === "webp") return "image/webp"
  if (ext === "svg") return "image/svg+xml"
  return "application/octet-stream"
}
