import { useState, type FormEvent } from 'react'
import { HardDrive, Cloud, Key, Shield, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GoogleLogo } from '@/components/auth/GoogleLogo'
import { apiFetch } from '@/lib/api'

type ConnectDriveModalProps = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ConnectDriveModal({ open, onClose, onSuccess }: ConnectDriveModalProps) {
  const [tab, setTab] = useState<'google' | 's3'>('google')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [s3Loading, setS3Loading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState('')
  const [showOauthForm, setShowOauthForm] = useState(false)

  // OAuth Credentials state
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [redirectUri, setRedirectUri] = useState(`${window.location.origin.replace('5173', '4000')}/connected-accounts/google/callback`)

  // S3 Config state
  const [s3Name, setS3Name] = useState('')
  const [s3Bucket, setS3Bucket] = useState('')
  const [s3Region, setS3Region] = useState('us-east-1')
  const [s3Endpoint, setS3Endpoint] = useState('')
  const [s3AccessKey, setS3AccessKey] = useState('')
  const [s3SecretKey, setS3SecretKey] = useState('')
  const [s3PathStyle] = useState(false)

  if (!open) return null

  async function handleGoogleConnect() {
    setGoogleLoading(true)
    setError('')
    try {
      const data = await apiFetch<{ url: string }>('/connected-accounts/google/connect-url')
      window.location.href = data.url
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect Google Drive'
      if (msg.toLowerCase().includes('credential') || msg.toLowerCase().includes('not configured')) {
        setShowOauthForm(true)
        setError('Google OAuth keys required below for first-time setup.')
      } else {
        setError(msg)
      }
      setGoogleLoading(false)
    }
  }

  async function handleSaveGoogleOAuth(e: FormEvent) {
    e.preventDefault()
    setOauthLoading(true)
    setError('')
    try {
      await apiFetch('/provider-configs/google', {
        method: 'POST',
        body: JSON.stringify({
          clientId,
          clientSecret,
          redirectUri: redirectUri || 'http://localhost:4000/connected-accounts/google/callback',
          scopes: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ],
        }),
      })
      // Proceed to Google OAuth connect URL
      const data = await apiFetch<{ url: string }>('/connected-accounts/google/connect-url')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save Google credentials')
      setOauthLoading(false)
    }
  }

  async function handleS3Submit(e: FormEvent) {
    e.preventDefault()
    setS3Loading(true)
    setError('')
    try {
      await apiFetch('/connected-accounts/s3', {
        method: 'POST',
        body: JSON.stringify({
          name: s3Name,
          bucket: s3Bucket,
          region: s3Region,
          endpoint: s3Endpoint || undefined,
          accessKeyId: s3AccessKey,
          secretAccessKey: s3SecretKey,
          forcePathStyle: s3PathStyle,
          prefix: 'omnidrive',
        }),
      })
      window.dispatchEvent(new Event('omnidrive:storage-changed'))
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect S3 storage')
      setS3Loading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900 p-6 text-slate-100 shadow-2xl ring-1 ring-white/10">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Add Storage Drive</h2>
            <p className="text-xs text-slate-400">Connect Google Drive or S3 storage to your OmniDrive gateway</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-800/80 p-1 border border-slate-700/50">
          <button
            onClick={() => { setTab('google'); setError('') }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              tab === 'google' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GoogleLogo className="h-4 w-4" /> Google Drive
          </button>
          <button
            onClick={() => { setTab('s3'); setError('') }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
              tab === 's3' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="h-4 w-4" /> S3 Compatible
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
            <span className="font-bold">•</span>
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: Google Drive */}
        {tab === 'google' && (
          <div className="mt-5 grid gap-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
              <Shield className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Files stream directly between your browser and cloud storage. Your data is never saved on local server disks.</span>
            </div>

            {!showOauthForm ? (
              <div className="grid gap-3 pt-2">
                <Button
                  onClick={handleGoogleConnect}
                  disabled={googleLoading}
                  className="h-12 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl gap-2 shadow-lg shadow-blue-600/25"
                >
                  <GoogleLogo className="h-5 w-5" />
                  {googleLoading ? 'Connecting...' : 'Link Google Drive Account'}
                  <ArrowRight className="h-4 w-4 ml-auto opacity-70" />
                </Button>

                <button
                  type="button"
                  onClick={() => setShowOauthForm(true)}
                  className="text-center text-xs text-slate-400 hover:text-blue-400 transition-colors py-1 flex items-center justify-center gap-1.5"
                >
                  <Key className="h-3.5 w-3.5" /> First time setup? Enter Google OAuth Credentials
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveGoogleOAuth} className="grid gap-3 pt-1">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-blue-400" /> Google OAuth App Setup
                  </span>
                  <button type="button" onClick={() => setShowOauthForm(false)} className="text-[11px] text-slate-400 hover:text-slate-200">Cancel</button>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Google Client ID</label>
                  <Input
                    placeholder="xxxxxxxxx.apps.googleusercontent.com"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    className="bg-slate-950 border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Google Client Secret</label>
                  <Input
                    type="password"
                    placeholder="GOCSPX-xxxxxxxxx"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    required
                    className="bg-slate-950 border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Redirect URI</label>
                  <Input
                    value={redirectUri}
                    onChange={(e) => setRedirectUri(e.target.value)}
                    required
                    className="bg-slate-950 border-slate-700 text-xs text-slate-400"
                  />
                </div>
                <Button type="submit" disabled={oauthLoading} className="h-10 mt-1 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl">
                  {oauthLoading ? 'Saving & Connecting...' : 'Save & Link Google Drive'}
                </Button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: S3 Compatible */}
        {tab === 's3' && (
          <form onSubmit={handleS3Submit} className="mt-4 grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Display Name</label>
                <Input placeholder="e.g. My Wasabi Storage" value={s3Name} onChange={(e) => setS3Name(e.target.value)} required className="bg-slate-950 border-slate-700 text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Bucket Name</label>
                <Input placeholder="my-bucket-name" value={s3Bucket} onChange={(e) => setS3Bucket(e.target.value)} required className="bg-slate-950 border-slate-700 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Region</label>
                <Input placeholder="us-east-1" value={s3Region} onChange={(e) => setS3Region(e.target.value)} required className="bg-slate-950 border-slate-700 text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Custom Endpoint (Optional)</label>
                <Input placeholder="https://s3.wasabisys.com" value={s3Endpoint} onChange={(e) => setS3Endpoint(e.target.value)} className="bg-slate-950 border-slate-700 text-xs" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Access Key ID</label>
              <Input placeholder="AKIA..." value={s3AccessKey} onChange={(e) => setS3AccessKey(e.target.value)} required className="bg-slate-950 border-slate-700 text-xs" />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Secret Access Key</label>
              <Input type="password" placeholder="Secret Key" value={s3SecretKey} onChange={(e) => setS3SecretKey(e.target.value)} required className="bg-slate-950 border-slate-700 text-xs" />
            </div>

            <Button type="submit" disabled={s3Loading} className="h-10 mt-1 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl">
              {s3Loading ? 'Connecting...' : 'Connect S3 Storage'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
