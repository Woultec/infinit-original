import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@hooks/useAuth'
import { getProfile, updateProfile, uploadAvatar, Profile } from '@services/profileService'
import { User, Mail, Phone, Loader2, Save, AtSign, Camera } from 'lucide-react'
import { Input } from '@components/ui/Input'
import { Button } from '@components/ui/Button'

export function ProfileForm() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [contacts, setContacts] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return
      try {
        const data = await getProfile(user.id)
        if (data) {
          setProfile(data)
          setFirstName(data.first_name || '')
          setLastName(data.last_name || '')
          setUsername(data.username || '')
          setContacts(data.contacts || '')
          setAvatarUrl(data.avatar_url || '')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
  }, [user?.id])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setIsUploading(true)
    setError(null)
    try {
      const publicUrl = await uploadAvatar(user.id, file)
      setAvatarUrl(publicUrl)
      // Automatically save to profile
      const updated = await updateProfile(user.id, {
        ...profile,
        id: user.id,
        avatar_url: publicUrl,
        first_name: firstName,
        last_name: lastName,
        username,
        contacts,
        email: user.email || '',
      })
      setProfile(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const updated = await updateProfile(user.id, {
        first_name: firstName,
        last_name: lastName,
        username,
        contacts,
        email: user.email || '',
        avatar_url: avatarUrl,
      })
      setProfile(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-6">Profile Details</h2>
      
      {error && (
        <div className="mb-6 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
          Profile updated successfully!
        </div>
      )}

      {/* Avatar Section */}
      <div className="mb-8 flex items-center gap-6">
        <div className="relative group">
          <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-muted shadow-sm flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            className="hidden" 
            accept="image/*" 
          />
        </div>
        <div>
          <h3 className="font-medium">Profile Picture</h3>
          <p className="text-sm text-muted-foreground">Upload a square image, ideally 256x256px.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">First Name</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="pl-10"
                placeholder="John"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Last Name</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="pl-10"
                placeholder="Doe"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <AtSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10"
                placeholder="johndoe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Contacts</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                required
                value={contacts}
                onChange={(e) => setContacts(e.target.value)}
                className="pl-10"
                placeholder="+1 234 567 890"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email Address (Read-only)</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              type="email"
              disabled
              value={user?.email || profile?.email || ''}
              className="pl-10 bg-muted cursor-not-allowed opacity-70"
            />
          </div>
          <p className="text-xs text-muted-foreground">Contact support to change your email address.</p>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button type="submit" disabled={isSaving || !profile} className="min-w-[120px]">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
