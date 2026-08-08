let token: string | null = null
export const tokenStore = {
  get: () => token,
  set: (t: string | null) => {
    token = t
    if (t) localStorage.setItem('gt_token', t)
    else localStorage.removeItem('gt_token')
  },
  load: () => { token = localStorage.getItem('gt_token'); return token },
}
