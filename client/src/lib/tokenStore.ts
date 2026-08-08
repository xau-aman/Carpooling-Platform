// In-memory access token store — avoids localStorage exposure
// Falls back to localStorage for cross-origin production (Vercel + Render)
let token: string | null = null

export const tokenStore = {
  get: () => token || localStorage.getItem('gt_token'),
  set: (t: string | null) => {
    token = t
    if (t) localStorage.setItem('gt_token', t)
    else localStorage.removeItem('gt_token')
  },
}
