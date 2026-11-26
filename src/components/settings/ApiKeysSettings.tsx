
import { useEffect, useRef, useState } from 'react'
import { copyToClipboard } from '../../utils/clipboard'
import {
  useApiKeys,
  type ApiKeysSettingsProps,
} from './useApiKeys'
import type { ApiKey } from './useApiKeys'
import ApiKeysList from './ApiKeysList'
import CreateApiKeyDialog from './CreateApiKeyDialog'
import ApiKeySecretDialog from './ApiKeySecretDialog'
import ApiKeyRevokeDialog from './ApiKeyRevokeDialog'
import styles from './ApiKeysSettings.module.css'

export type { ApiKey, ApiKeysSettingsProps } from './useApiKeys'

export default function ApiKeysSettings({
  generateApiKey,
}: ApiKeysSettingsProps = {}) {
  const {
    apiKeys,
    createKey,
    revokeKey,
    rotateKey,
  } = useApiKeys(generateApiKey)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [secretModal, setSecretModal] = useState<{
    title: string
    keyName: string
    secret: string
  } | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKey | null>(null)
  const [confirmationText, setConfirmationText] = useState('')
  const [copyFeedback, setCopyFeedback] = useState<{
    keyId: string
    success: boolean
  } | null>(null)

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const secretTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
      if (secretTimerRef.current) clearTimeout(secretTimerRef.current)
    }
  }, [])

  const handleCopy = async (keyId: string, text: string) => {
    const success = await copyToClipboard(text)

    setCopyFeedback({ keyId, success })

    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)

    copyTimerRef.current = setTimeout(() => {
      setCopyFeedback(null)
    }, 2000)
  }

  const handleCreate = (name: string, scopes: string[], expiry: string) => {
    const result = createKey(name, scopes, expiry)

    setShowCreateModal(false)
    setCopiedSecret(false)
    setSecretModal({
      title: 'API Key Created',
      keyName: result.key.name,
      secret: result.secret,
    })
  }

  const handleRevokeRequest = (keyId: string) => {
    const key = apiKeys.find(item => item.id === keyId)

    if (key) {
      setKeyToRevoke(key)
      setConfirmationText('')
    }
  }

  const handleRevoke = () => {
    if (!keyToRevoke) return

    revokeKey(keyToRevoke.id)
    setKeyToRevoke(null)
    setConfirmationText('')
  }

  const handleRotate = () => {
    if (!keyToRevoke) return

    const result = rotateKey(keyToRevoke.id)

    if (result) {
      setKeyToRevoke(null)
      setConfirmationText('')
      setCopiedSecret(false)
      setSecretModal({
        title: 'API Key Rotated',
        keyName: result.key.name,
        secret: result.secret,
      })
    }
  }

  const handleSecretCopy = async () => {
    if (!secretModal) return

    const success = await copyToClipboard(secretModal.secret)

    setCopiedSecret(success)

    if (secretTimerRef.current) clearTimeout(secretTimerRef.current)

    secretTimerRef.current = setTimeout(() => {
      setCopiedSecret(false)
    }, 2000)
  }

  const activeKeysCount = apiKeys.filter(key => key.isActive).length
  const isOnlyKey = activeKeysCount <= 1
  const isRevokeConfirmed =
    keyToRevoke !== null &&
    confirmationText === keyToRevoke.name

  return (
    <div className={styles.container}>
      <ApiKeysList
        apiKeys={apiKeys}
        copyFeedback={copyFeedback}
        onCreate={() => setShowCreateModal(true)}
        onCopy={handleCopy}
        onRevoke={handleRevokeRequest}
      />

      {showCreateModal && (
        <CreateApiKeyDialog
          onCreate={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {secretModal && (
        <ApiKeySecretDialog
          secretModal={secretModal}
          copiedSecret={copiedSecret}
          onCopy={handleSecretCopy}
          onClose={() => setSecretModal(null)}
        />
      )}

      {keyToRevoke && (
        <ApiKeyRevokeDialog
          keyToRevoke={keyToRevoke}
          isOnlyKey={isOnlyKey}
          confirmationText={confirmationText}
          isRevokeConfirmed={isRevokeConfirmed}
          onConfirmationTextChange={setConfirmationText}
          onCancel={() => {
            setKeyToRevoke(null)
            setConfirmationText('')
          }}
          onRevoke={handleRevoke}
          onRotate={handleRotate}
        />
      )}
    </div>
  )
}
