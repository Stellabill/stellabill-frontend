import { useState } from 'react'
import { defaultGenerateApiKey, maskApiKey } from '../../utils/apiKey'

export interface ApiKey {
  id: string
  name: string
  key: string
  scopes: string[]
  createdAt: string
  createdBy: string
  lastUsed?: string
  expiresAt?: string
  isActive: boolean
}

export interface ApiKeysSettingsProps {
  generateApiKey?: () => string
}

export const AVAILABLE_SCOPES = ['read', 'write', 'admin'] as const

export function useApiKeys(generateApiKey = defaultGenerateApiKey) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'sk_live_••••••••••••••••3a8f',
      scopes: ['read', 'write', 'admin'],
      createdAt: '2024-01-15',
      createdBy: 'alice@example.com',
      lastUsed: '2024-03-28',
      isActive: true,
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'sk_test_••••••••••••••••5b2c',
      scopes: ['read', 'write'],
      createdAt: '2024-02-01',
      createdBy: 'bob@example.com',
      lastUsed: '2024-03-27',
      expiresAt: '2024-06-01',
      isActive: true,
    },
  ])

  const createKey = (name: string, scopes: string[], expiry: string) => {
    const secret = generateApiKey()
    const masked = maskApiKey(secret)

    const newKey: ApiKey = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now()),
      name: name.trim(),
      key: masked,
      scopes: [...scopes],
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'alice@example.com',
      expiresAt: expiry || undefined,
      isActive: true,
    }

    setApiKeys(prev => [newKey, ...prev])

    return { key: newKey, secret }
  }

  const revokeKey = (keyId: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== keyId))
  }

  const rotateKey = (keyId: string) => {
    const keyToRotate = apiKeys.find(key => key.id === keyId)
    if (!keyToRotate) return null

    const secret = generateApiKey()
    const masked = maskApiKey(secret)

    setApiKeys(prev =>
      prev.map(key =>
        key.id === keyId
          ? {
              ...key,
              key: masked,
              createdAt: new Date().toISOString().split('T')[0],
              lastUsed: undefined,
            }
          : key
      )
    )

    return { key: keyToRotate, secret }
  }

  return {
    apiKeys,
    createKey,
    revokeKey,
    rotateKey,
  }
}
