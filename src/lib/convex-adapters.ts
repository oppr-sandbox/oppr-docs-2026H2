import type { Doc as ConvexDoc } from "../../convex/_generated/dataModel"
import type { Asset, AssetLog, Doc } from "@/types"

export function toLegacyDoc(d: ConvexDoc<"documents">): Doc {
  return {
    id: d._id,
    naming_code: d.namingCode,
    title: d.title,
    type: d.type,
    status: d.status,
    current_version: d.currentVersion,
    owner_id: d.ownerId ?? "",
    tags: d.tags,
    created_at: new Date(d._creationTime).toISOString(),
    updated_at: new Date(d.updatedAt).toISOString(),
  }
}

export function toLegacyAsset(a: ConvexDoc<"assets">): Asset {
  return {
    id: a._id,
    code: a.code,
    name: a.name,
    site: a.site,
    location: a.location,
    qr_token: a.qrToken,
    created_at: new Date(a._creationTime).toISOString(),
    description: a.description,
    level: a.level,
    floorplan: a.floorplan,
    is_linked: a.isLinked ? 1 : 0,
    linked_log_code: a.linkedLogCode,
    linked_log_name: a.linkedLogName,
    linked_log_description: a.linkedLogDescription,
    pin_number: a.pinNumber,
    pin_x: a.pinX,
    pin_y: a.pinY,
  }
}

export function toLegacyAssetLog(l: ConvexDoc<"assetLogs">): AssetLog {
  return {
    asset_id: l.assetId,
    code: l.code,
    name: l.name,
    description: l.description,
  }
}
