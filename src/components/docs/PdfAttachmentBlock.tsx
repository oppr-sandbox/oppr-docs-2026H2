// PdfAttachmentBlock
//
// Block-level TipTap atom `pdfAttachment` that embeds an imported PDF inside a
// normal TipTap document. The PDF is stored in Convex storage; the node holds
// the storageId and resolves a signed URL at render time. Authors can write
// their own content (headings, callouts, asset pills) above and below it — the
// PDF is "an attachment you can scroll through", not the whole body.
//
// Round-trips attrs via data-* so the read-only renderer is identical.

import { Node, mergeAttributes } from "@tiptap/core"
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react"
import { useQuery } from "convex/react"
import { FileText } from "lucide-react"
import { api } from "../../../convex/_generated/api"
import type { Id } from "../../../convex/_generated/dataModel"
import { PdfViewer } from "./PdfViewer"

function PdfAttachmentNodeView({ node }: ReactNodeViewProps) {
  const storageId = (node.attrs.storageId as string) || ""
  const filename = (node.attrs.filename as string) || "Attached PDF"
  const pageCount = Number(node.attrs.pageCount ?? 0)

  const url = useQuery(
    api.files.getUrl,
    storageId ? { storageId: storageId as Id<"_storage"> } : "skip",
  )

  return (
    <NodeViewWrapper className="my-4" data-pdf-attachment>
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="truncate text-sm font-medium">{filename}</span>
          {pageCount > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">
              {pageCount} page{pageCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="p-3" contentEditable={false}>
          <PdfViewer url={url ?? null} />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pdfAttachment: {
      insertPdfAttachment: (attrs: {
        storageId: string
        filename: string
        pageCount: number
      }) => ReturnType
    }
  }
}

export const PdfAttachmentNode = Node.create({
  name: "pdfAttachment",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      storageId: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-storage-id") ?? "",
        renderHTML: (attrs) => ({ "data-storage-id": attrs.storageId }),
      },
      filename: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-filename") ?? "",
        renderHTML: (attrs) => ({ "data-filename": attrs.filename }),
      },
      pageCount: {
        default: 0,
        parseHTML: (el) => Number(el.getAttribute("data-page-count") ?? 0),
        renderHTML: (attrs) => ({
          "data-page-count": String(attrs.pageCount ?? 0),
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-pdf-attachment]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-pdf-attachment": "" })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PdfAttachmentNodeView)
  },

  addCommands() {
    return {
      insertPdfAttachment:
        (attrs) =>
        ({ chain }) =>
          chain().focus().insertContent({ type: this.name, attrs }).run(),
    }
  },
})
