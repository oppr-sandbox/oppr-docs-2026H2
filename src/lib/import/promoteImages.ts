// Push extracted image blobs through the existing Convex `images` pipeline.
// Each blob: generateUploadUrl → POST → createFromUpload (sha256-deduped).

import type { ReactMutation } from "convex/react"
import type { FunctionReference } from "convex/server"
import type { Id } from "../../../convex/_generated/dataModel"
import type { ExtractedImage } from "./extractPdf"

type GenerateUploadUrlMutation = FunctionReference<
  "mutation",
  "public",
  Record<string, never>,
  string
>

type CreateFromUploadMutation = FunctionReference<
  "mutation",
  "public",
  {
    storageId: Id<"_storage">
    filename: string
    contentType: string
    byteSize: number
    width: number | null
    height: number | null
    sha256: string
    altText: string
  },
  { id: Id<"images">; deduped: boolean; url: string | null }
>

export interface PromoteOptions {
  generateUploadUrl: ReactMutation<GenerateUploadUrlMutation>
  createFromUpload: ReactMutation<CreateFromUploadMutation>
  onProgress?: (done: number, total: number) => void
}

export async function promoteImages(
  images: ExtractedImage[],
  opts: PromoteOptions,
): Promise<Id<"images">[]> {
  const ids: Id<"images">[] = []
  for (let i = 0; i < images.length; i++) {
    const img = images[i]
    const contentType = img.contentType
    const uploadUrl = await opts.generateUploadUrl()
    const put = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: img.blob,
    })
    if (!put.ok) {
      opts.onProgress?.(i + 1, images.length)
      continue
    }
    const json = (await put.json()) as { storageId: Id<"_storage"> }
    const result = await opts.createFromUpload({
      storageId: json.storageId,
      filename: img.filename,
      contentType,
      byteSize: img.blob.size,
      width: img.width,
      height: img.height,
      sha256: img.sha256,
      altText: img.hintAlt,
    })
    ids.push(result.id)
    opts.onProgress?.(i + 1, images.length)
  }
  return ids
}
