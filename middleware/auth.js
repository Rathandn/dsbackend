export function requireAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key']
  if (adminKey !== 'SAREE_ADMIN_2024') {
    return res.status(403).json({ message: 'Unauthorized admin access' })
  }
  next()
}
