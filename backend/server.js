import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '..', '.env'), override: false })

const app = express()
app.use(express.json())
app.use(cors())

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const PORT = process.env.PORT || 3001

let supabaseAdmin = null
function getSupabaseAdmin() {
  if (!supabaseAdmin && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return supabaseAdmin
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Naver OAuth - Step 1: Redirect to Naver
app.get('/api/auth/naver', (_req, res) => {
  if (!NAVER_CLIENT_ID) {
    return res.status(500).json({ error: 'Naver OAuth not configured' })
  }
  const state = Math.random().toString(36).substring(2)
  const callbackUrl = `${BASE_URL}/api/auth/naver/callback`
  const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}`
  res.redirect(naverAuthUrl)
})

// Naver OAuth - Step 2: Callback
app.get('/api/auth/naver/callback', async (req, res) => {
  try {
    const { code, state } = req.query
    console.log('[Naver] callback received, code:', !!code)
    if (!code) {
      return res.redirect(`${BASE_URL}?error=no_code`)
    }

    const callbackUrl = `${BASE_URL}/api/auth/naver/callback`

    // Exchange code for token
    const tokenResponse = await fetch(
      `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${NAVER_CLIENT_ID}&client_secret=${NAVER_CLIENT_SECRET}&code=${code}&state=${state}`
    )
    const tokenData = await tokenResponse.json()
    console.log('[Naver] token exchange:', tokenData.access_token ? 'success' : 'failed', tokenData.error || '')

    if (!tokenData.access_token) {
      return res.redirect(`${BASE_URL}?error=token_failed`)
    }

    // Get user info
    const profileResponse = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profileData = await profileResponse.json()
    console.log('[Naver] profile:', profileData.resultcode, profileData.response?.email)

    if (profileData.resultcode !== '00') {
      return res.redirect(`${BASE_URL}?error=profile_failed`)
    }

    const { email, name } = profileData.response
    const naverEmail = email || `naver_${profileData.response.id}@naver.placeholder`
    console.log('[Naver] email:', naverEmail, 'name:', name)

    // Check if user exists
    const admin = getSupabaseAdmin()
    if (!admin) {
      console.log('[Naver] supabase admin not configured')
      return res.redirect(`${BASE_URL}?error=supabase_not_configured`)
    }
    const { data: existingUsers } = await admin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u) => u.email === naverEmail)
    console.log('[Naver] existing user:', !!existingUser)

    let userId
    if (existingUser) {
      userId = existingUser.id
    } else {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: naverEmail,
        email_confirm: true,
        user_metadata: { full_name: name, provider: 'naver' },
      })
      if (createError) {
        console.log('[Naver] create user error:', createError)
        return res.redirect(`${BASE_URL}?error=create_user_failed`)
      }
      userId = newUser.user.id
    }
    console.log('[Naver] userId:', userId)

    // Generate magic link
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: naverEmail,
    })

    if (linkError || !linkData) {
      console.log('[Naver] magic link error:', linkError)
      return res.redirect(`${BASE_URL}?error=magic_link_failed`)
    }

    const tokenHash = linkData.properties?.hashed_token
    console.log('[Naver] success! redirecting with token_hash')
    res.redirect(`${BASE_URL}?token_hash=${tokenHash}&type=magiclink`)
  } catch (error) {
    console.error('[Naver] auth error:', error)
    res.redirect(`${BASE_URL}?error=server_error`)
  }
})

// Serve static files in production
const distPath = path.join(__dirname, '..', 'frontend', 'dist')
app.use(express.static(distPath))
app.get('{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Bicycle backend running on port ${PORT}`)
  console.log(`[ENV] SUPABASE_URL: ${process.env.SUPABASE_URL ? 'set' : 'MISSING'}`)
  console.log(`[ENV] SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING'}`)
  console.log(`[ENV] BASE_URL: ${BASE_URL}`)
  console.log(`[ENV] NAVER_CLIENT_ID: ${NAVER_CLIENT_ID ? 'set' : 'MISSING'}`)
})
