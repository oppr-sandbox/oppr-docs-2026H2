import { httpRouter } from "convex/server"
import { auth } from "./auth"
import { askStream, askStreamOptions } from "./ai/ask"

const http = httpRouter()

auth.addHttpRoutes(http)

http.route({
  path: "/ai/askStream",
  method: "POST",
  handler: askStream,
})

http.route({
  path: "/ai/askStream",
  method: "OPTIONS",
  handler: askStreamOptions,
})

export default http
