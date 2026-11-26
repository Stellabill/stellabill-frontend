import {
  Key,
  Plus,
  Copy,
  Trash2,
  Calendar,
  User,
} from 'lucide-react'
import type { ApiKey } from './useApiKeys'
import styles from './ApiKeysSettings.module.css'

interface ApiKeysListProps {
  apiKeys: ApiKey[]
  copyFeedback: { keyId: string; success: boolean } | null
  onCreate: () => void
  onCopy: (keyId: string, text: string) => void
  onRevoke: (keyId: string) => void
}

export default function ApiKeysList({
  apiKeys,
  copyFeedback,
  onCreate,
  onCopy,
  onRevoke,
}: ApiKeysListProps) {
  return (
    <>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <Key size={20} className={styles.sectionIcon} />
          <h3 className={styles.sectionTitle}>API Keys</h3>
          <span className={styles.countBadge}>
            {apiKeys.length} keys
          </span>
        </div>

        <button
          onClick={onCreate}
          className={styles.createTriggerButton}
        >
          <Plus size={14} />
          Create API Key
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeadRow}>
              <th className={styles.tableHeadCell}>Key Name</th>
              <th className={styles.tableHeadCell}>Secret Key</th>
              <th className={styles.tableHeadCell}>Scopes</th>
              <th className={styles.tableHeadCell}>Metadata</th>
              <th className={styles.tableHeadCellRight}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {apiKeys.map((key) => (
              <tr key={key.id} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <div className={styles.keyNameRow}>
                    <span className={styles.keyName}>{key.name}</span>
                    {key.isActive ? (
                      <span className={[styles.statusBadge, styles.statusActive].join(' ')}>
                        Active
                      </span>
                    ) : (
                      <span className={[styles.statusBadge, styles.statusInactive].join(' ')}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className={styles.createdAt}>
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                </td>

                <td className={styles.tableCell}>
                  <div className={styles.secretBox}>{key.key}</div>
                  <div className={styles.copyRow}>
                    <button
                      onClick={() => onCopy(key.id, key.key)}
                      className={styles.copyButton}
                    >
                      <Copy size={12} />
                      Copy
                    </button>

                    {copyFeedback?.keyId === key.id && (
                      <span
                        className={[
                          styles.copyFeedback,
                          copyFeedback.success
                            ? styles.copySuccess
                            : styles.copyError,
                        ].join(' ')}
                      >
                        {copyFeedback.success
                          ? 'Copied!'
                          : 'Copy failed — select and copy manually'}
                      </span>
                    )}
                  </div>
                </td>

                <td className={styles.tableCell}>
                  <div className={styles.scopesList}>
                    {key.scopes.map((scope) => (
                      <span
                        key={scope}
                        className={[
                          styles.scopeBadge,
                          scope === 'admin'
                            ? styles.scopeAdmin
                            : scope === 'write'
                              ? styles.scopeWrite
                              : styles.scopeRead,
                        ].join(' ')}
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </td>

                <td className={styles.tableCell}>
                  <div className={styles.metadataList}>
                    <div className={styles.metadataItem}>
                      <User size={12} />
                      <span>{key.createdBy}</span>
                    </div>

                    {key.lastUsed ? (
                      <div className={styles.metadataItem}>
                        <Calendar size={12} />
                        <span>
                          Used {new Date(key.lastUsed).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <div className={styles.metadataMuted}>
                        <Calendar size={12} />
                        <span>Never used</span>
                      </div>
                    )}
                  </div>
                </td>

                <td className={styles.tableCellRight}>
                  <button
                    onClick={() => onRevoke(key.id)}
                    className={styles.revokeButton}
                  >
                    <Trash2 size={12} />
                    Revoke
                  </button>
                </td>
              </tr>
            ))}

            {apiKeys.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.emptyCell}>
                  No API keys found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
