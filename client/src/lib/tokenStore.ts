// In-memory access token store — avoids localStorage exposure
let token: string | null = null

export const tokenStore = {
  get: () => token,
  set: (t: string | null) => { token = t },
}
