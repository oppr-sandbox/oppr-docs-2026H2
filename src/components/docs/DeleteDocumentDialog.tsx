import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { Doc } from "@/types"

interface DeleteDocumentDialogProps {
  doc: Doc | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onArchive: () => void
  onConfirmDelete: () => void
  busy?: boolean
}

export function DeleteDocumentDialog({
  doc,
  open,
  onOpenChange,
  onArchive,
  onConfirmDelete,
  busy = false,
}: DeleteDocumentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this document permanently?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              <span className="font-mono text-xs font-semibold">
                {doc?.naming_code}
              </span>{" "}
              <span>· {doc?.title}</span>
            </span>
            <span className="block">
              This removes the document, every version, all chunks, asset
              links, and any uploaded PDF from Convex storage. There is no
              undo.
            </span>
            <span className="block">
              If you only want to hide it from the active library, archive it
              instead — it stays in the database and can be restored later.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <Button
            variant="outline"
            onClick={onArchive}
            disabled={busy || doc?.status === "archived"}
          >
            Archive instead
          </Button>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirmDelete()
            }}
            disabled={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? "Deleting…" : "Delete permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
