import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Braces,
  Copy,
  Eye,
  Fingerprint,
  Globe,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  Terminal,
  Trash2,
  Upload,
} from 'lucide-react'
import type { Credential, CredentialsResponse } from '../../types'
import { credentialsApi } from '../../lib/endpoints'
import { apiErrorMessage } from '../../lib/api'
import { copyToClipboard } from '../../lib/clipboard'
import { formatDate } from '../../lib/format'
import { useDebouncedValue } from '../../lib/useDebounce'
import { CREDENTIAL_HEALTH, CREDENTIAL_TYPES } from '../../lib/constants'
import { useToast } from '../../context/ToastContext'
import { Badge, HealthBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Select } from '../../components/ui/Input'
import { ActionMenu } from '../../components/ui/Menu'
import { PageHeader } from '../../components/ui/PageHeader'
import { Pagination } from '../../components/ui/Pagination'
import { Skeleton } from '../../components/ui/Spinner'
import { FilterTabs, SearchInput } from '../../components/ui/Toolbar'
import { CredentialFormDialog } from '../../components/credentials/CredentialFormDialog'
import { RevealCredentialDialog } from '../../components/credentials/RevealCredentialDialog'
import { RotateCredentialDialog } from '../../components/credentials/RotateCredentialDialog'
import { ImportCredentialsDialog } from '../../components/credentials/ImportCredentialsDialog'
import { cn } from '../../lib/cn'

type Filter = 'all' | 'favorites'

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'type', label: 'Type' },
  { value: 'last_rotated_at', label: 'Last rotated' },
  { value: 'created_at', label: 'Date added' },
]

const typeIcons = {
  password: KeyRound,
  passkey: Fingerprint,
  ssh_key: Terminal,
  api_key: Braces,
  other: Shield,
} as const

export function CredentialsPage() {
  const { success, error } = useToast()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [filter, setFilter] = useState<Filter>('all')
  const [type, setType] = useState('all')
  const [health, setHealth] = useState('all')
  const [sort, setSort] = useState('name')
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<CredentialsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Credential | null>(null)
  const [revealing, setRevealing] = useState<Credential | null>(null)
  const [rotating, setRotating] = useState<Credential | null>(null)
  const [deleting, setDeleting] = useState<Credential | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [working, setWorking] = useState(false)

  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setFailed(null)

    credentialsApi
      .list({
        q: debouncedSearch.trim() || undefined,
        type: type === 'all' ? undefined : type,
        health: health === 'all' ? undefined : health,
        favorites: filter === 'favorites' || undefined,
        sort,
        direction,
        per_page: 8,
        page,
      })
      .then((response) => {
        if (active) setData(response.data)
      })
      .catch((caught) => {
        if (active) setFailed(apiErrorMessage(caught, 'Your credentials vault could not be loaded.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [debouncedSearch, filter, type, health, sort, direction, page, reloadKey])

  const patchCredential = (next: Credential) => {
    setData((current) =>
      current
        ? { ...current, data: current.data.map((item) => (item.id === next.id ? next : item)) }
        : current,
    )
  }

  const toggleFavorite = async (credential: Credential) => {
    try {
      const response = await credentialsApi.update(credential.id, {
        is_favorite: !credential.is_favorite,
      })
      patchCredential(response.data.credential)
      success(
        response.data.credential.is_favorite ? 'Pinned to favorites' : 'Removed from favorites',
        credential.name,
      )
    } catch (caught) {
      error('Could not update favorite', apiErrorMessage(caught))
    }
  }

  const copyIdentifier = async (credential: Credential) => {
    if (!credential.identifier) {
      error('Nothing to copy', 'This credential has no identifier stored.')
      return
    }
    const ok = await copyToClipboard(credential.identifier)
    if (ok) success('Identifier copied', credential.name)
    else error('Copy failed', 'Select the identifier manually.')
  }

  const remove = async () => {
    if (!deleting) return
    setWorking(true)
    try {
      await credentialsApi.remove(deleting.id)
      success('Credential deleted', `${deleting.name} was removed from your vault.`)
      setDeleting(null)
      reload()
    } catch (caught) {
      error('Could not delete credential', apiErrorMessage(caught))
    } finally {
      setWorking(false)
    }
  }

  const credentials = data?.data ?? []
  const stats = data?.stats
  const meta = data?.meta

  const healthScore = stats && stats.total > 0 ? Math.round((stats.strong / stats.total) * 100) : 0
  const twoFactorCoverage =
    stats && stats.total > 0 ? Math.round((stats.two_factor_enabled / stats.total) * 100) : 0
  const healthLabel = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'At risk'

  const tips = useMemo(() => {
    if (!stats || stats.total === 0) {
      return ['Add your first credential to start monitoring vault health.']
    }
    const items: string[] = []
    if (stats.needs_rotation > 0) {
      items.push(`Rotate ${stats.needs_rotation} credential${stats.needs_rotation === 1 ? '' : 's'} that are weak or older than 45 days.`)
    }
    if (stats.two_factor_enabled < stats.total) {
      items.push(`Enable two-factor on ${stats.total - stats.two_factor_enabled} account${stats.total - stats.two_factor_enabled === 1 ? '' : 's'} to raise coverage.`)
    }
    if (stats.passkeys === 0) {
      items.push('Add a passkey for phishing-resistant sign-in on critical accounts.')
    }
    if (items.length === 0) {
      items.push('Your vault is in great shape. Keep rotating secrets every 45 days.')
    }
    return items
  }, [stats])

  return (
    <div className="space-y-4">
      <PageHeader
        crumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Credentials' }]}
        title="Credentials"
        description="Passwords, passkeys and API keys sealed in your encrypted vault."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setImportOpen(true)}
              leftIcon={<Upload className="h-4 w-4" />}
            >
              Import
            </Button>
            <Button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add credential
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <CredentialStat icon={KeyRound} label="Credentials" value={stats?.total ?? 0} tone="brand" />
        <CredentialStat icon={Fingerprint} label="Passkeys" value={stats?.passkeys ?? 0} tone="violet" />
        <CredentialStat icon={ShieldCheck} label="Strong secrets" value={stats?.strong ?? 0} tone="success" />
        <CredentialStat icon={ShieldAlert} label="Need rotation" value={stats?.needs_rotation ?? 0} tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card padded={false} className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line px-4 py-3.5">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <SearchInput
                value={search}
                onChange={(value) => {
                  setSearch(value)
                  setPage(1)
                }}
                placeholder="Search credentials…"
                ariaLabel="Search credentials"
                className="w-full sm:max-w-[280px]"
              />
              <div className="flex items-center gap-2">
                <Select
                  options={[{ value: 'all', label: 'All types' }, ...CREDENTIAL_TYPES]}
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value)
                    setPage(1)
                  }}
                  aria-label="Filter by credential type"
                  className="h-9 w-[132px] text-[12px]"
                />
                <Select
                  options={[{ value: 'all', label: 'All health' }, ...CREDENTIAL_HEALTH]}
                  value={health}
                  onChange={(event) => {
                    setHealth(event.target.value)
                    setPage(1)
                  }}
                  aria-label="Filter by credential health"
                  className="h-9 w-[138px] text-[12px]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setDirection((value) => (value === 'asc' ? 'desc' : 'asc'))
                    setPage(1)
                  }}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-slate-500 transition hover:bg-slate-50"
                  aria-label={`Sort ${direction === 'asc' ? 'descending' : 'ascending'}`}
                  title={direction === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {direction === 'asc' ? (
                    <ArrowUpNarrowWide className="h-4 w-4" />
                  ) : (
                    <ArrowDownWideNarrow className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FilterTabs
                tabs={[
                  { value: 'all' as Filter, label: 'All credentials', count: stats?.total },
                  { value: 'favorites' as Filter, label: 'Favorites' },
                ]}
                value={filter}
                onChange={(value) => {
                  setFilter(value)
                  setPage(1)
                }}
              />
              <Select
                options={sortOptions}
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value)
                  setPage(1)
                }}
                aria-label="Sort credentials"
                className="h-8 w-[138px] text-[11.5px]"
              />
            </div>
          </div>

          {loading && !data ? (
            <CredentialTableSkeleton />
          ) : credentials.length === 0 ? (
            <EmptyState
              icon={<KeyRound className="h-6 w-6" />}
              title={debouncedSearch ? 'No matching credentials' : 'Your vault is empty'}
              description={
                debouncedSearch
                  ? 'Try a different search term or clear the type and health filters.'
                  : 'Add a password, passkey or API key to start monitoring your vault health.'
              }
              action={
                <Button
                  onClick={() => {
                    setEditing(null)
                    setFormOpen(true)
                  }}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add credential
                </Button>
              }
            />
          ) : (
            <>
              <div className="hidden md:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-slate-50/70 text-left">
                      <Th>Credential</Th>
                      <Th>Type</Th>
                      <Th>Identifier</Th>
                      <Th>Health</Th>
                      <Th>2FA</Th>
                      <Th>Last rotated</Th>
                      <Th>
                        <span className="sr-only">Actions</span>
                      </Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {credentials.map((credential) => {
                      const Icon = typeIcons[credential.type] ?? Shield
                      return (
                        <tr key={credential.id} className="group transition hover:bg-slate-50/80">
                          <td className="px-4 py-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                                <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
                              </span>
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => setRevealing(credential)}
                                  className="flex max-w-[220px] items-center gap-1.5 truncate text-left text-[12.5px] font-semibold text-ink transition hover:text-brand-600"
                                >
                                  <span className="truncate">{credential.name}</span>
                                  {credential.is_favorite && (
                                    <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-500" />
                                  )}
                                </button>
                                {credential.url ? (
                                  <a
                                    href={credential.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-0.5 flex max-w-[220px] items-center gap-1 truncate text-[10.5px] text-muted transition hover:text-brand-600"
                                  >
                                    <Globe className="h-2.5 w-2.5 shrink-0" />
                                    <span className="truncate">{credential.url.replace(/^https?:\/\//, '')}</span>
                                  </a>
                                ) : (
                                  <p className="mt-0.5 text-[10.5px] text-slate-400">
                                    Added {formatDate(credential.created_at)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[11.5px] text-slate-600">{credential.type_label}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[11px] text-slate-500">
                              {credential.masked_identifier ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <HealthBadge health={credential.health} />
                              {credential.is_expired && <Badge tone="danger">Expired</Badge>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {credential.two_factor_enabled ? (
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700">
                                <ShieldCheck className="h-3 w-3" />
                                On
                              </span>
                            ) : (
                              <span className="text-[10.5px] font-medium text-slate-400">Off</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-500">
                            {credential.last_rotated_human ?? 'Never'}
                          </td>
                          <td className="px-4 py-3">
                            <ActionMenu
                              items={[
                                { label: 'Reveal secret', icon: Eye, onSelect: () => setRevealing(credential) },
                                { label: 'Copy identifier', icon: Copy, onSelect: () => void copyIdentifier(credential) },
                                {
                                  label: 'Edit credential',
                                  icon: Pencil,
                                  onSelect: () => {
                                    setEditing(credential)
                                    setFormOpen(true)
                                  },
                                },
                                { label: 'Rotate secret', icon: RefreshCw, onSelect: () => setRotating(credential) },
                                {
                                  label: credential.is_favorite ? 'Remove favorite' : 'Pin to favorites',
                                  icon: Star,
                                  onSelect: () => void toggleFavorite(credential),
                                },
                                {
                                  label: 'Delete credential',
                                  icon: Trash2,
                                  tone: 'danger',
                                  onSelect: () => setDeleting(credential),
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-line md:hidden">
                {credentials.map((credential) => {
                  const Icon = typeIcons[credential.type] ?? Shield
                  return (
                    <div key={credential.id} className="p-3.5">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-100">
                          <Icon className="h-4 w-4" strokeWidth={1.9} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => setRevealing(credential)}
                            className="flex items-center gap-1.5 text-left text-[12.5px] font-semibold text-ink"
                          >
                            <span className="truncate">{credential.name}</span>
                            {credential.is_favorite && (
                              <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-500" />
                            )}
                          </button>
                          <p className="mt-0.5 truncate font-mono text-[10.5px] text-muted">
                            {credential.masked_identifier ?? credential.type_label}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <HealthBadge health={credential.health} />
                            <span className="text-[10px] text-slate-400">{credential.type_label}</span>
                            {credential.two_factor_enabled && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700">
                                <ShieldCheck className="h-2.5 w-2.5" />
                                2FA
                              </span>
                            )}
                          </div>
                        </div>
                        <ActionMenu
                          items={[
                            { label: 'Reveal secret', icon: Eye, onSelect: () => setRevealing(credential) },
                            {
                              label: 'Edit credential',
                              icon: Pencil,
                              onSelect: () => {
                                setEditing(credential)
                                setFormOpen(true)
                              },
                            },
                            { label: 'Rotate secret', icon: RefreshCw, onSelect: () => setRotating(credential) },
                            {
                              label: 'Delete credential',
                              icon: Trash2,
                              tone: 'danger',
                              onSelect: () => setDeleting(credential),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {failed && !data ? (
            <EmptyState
              icon={<ShieldAlert className="h-6 w-6" />}
              title="Vault unavailable"
              description={failed}
              action={
                <Button onClick={reload} leftIcon={<RefreshCw className="h-4 w-4" />}>
                  Try again
                </Button>
              }
            />
          ) : null}

          {meta && meta.total > 0 && (
            <div className="border-t border-line px-4 py-3.5">
              <Pagination meta={meta} onPageChange={setPage} noun="credentials" />
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Vault health" description="Derived from secret strength and rotation age." />
            <div className="mt-4 flex items-center gap-4">
              <div
                className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(${
                    healthScore >= 80 ? '#16a34a' : healthScore >= 60 ? '#2563eb' : '#f59e0b'
                  } ${healthScore}%, #e2e8f0 ${healthScore}% 100%)`,
                }}
              >
                <div className="flex h-[62px] w-[62px] flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-lg font-bold leading-none text-ink">{healthScore}</span>
                  <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
                    / 100
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[15px] font-bold text-ink">{healthLabel}</p>
                <p className="mt-1 text-[11px] leading-5 text-muted">
                  {stats?.strong ?? 0} of {stats?.total ?? 0} credentials have strong, recently rotated
                  secrets.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              <HealthRow label="Strong" value={stats?.strong ?? 0} total={stats?.total ?? 0} tone="bg-emerald-500" />
              <HealthRow
                label="Needs rotation"
                value={Math.max(0, (stats?.total ?? 0) - (stats?.strong ?? 0))}
                total={stats?.total ?? 0}
                tone="bg-amber-400"
              />
              <HealthRow
                label="Reused"
                value={stats?.reused ?? 0}
                total={stats?.total ?? 0}
                tone="bg-red-500"
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-line bg-slate-50/70 px-3 py-2.5">
              <span className="text-[11px] text-slate-600">Two-factor coverage</span>
              <span className="text-[11px] font-bold text-ink">{twoFactorCoverage}%</span>
            </div>
          </Card>

          <Card>
            <CardHeader title="Recommended actions" />
            <ul className="mt-3 space-y-2.5">
              {tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <p className="text-[11.5px] leading-5 text-slate-600">{tip}</p>
                </li>
              ))}
            </ul>
            {stats && stats.needs_rotation > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
                onClick={() => {
                  setHealth('fair')
                  setPage(1)
                }}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Review credentials to rotate
              </Button>
            )}
          </Card>

          <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <p className="text-[12px] font-bold text-ink">Zero-knowledge by design</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-600">
              Secrets are encrypted at rest and never included in list responses. Reveal actions are
              logged in your audit trail.
            </p>
          </div>
        </div>
      </div>

      {failed && data ? (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-2.5 text-[11.5px] text-amber-800">
          {failed}
        </p>
      ) : null}

      <CredentialFormDialog
        open={formOpen}
        credential={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(credential) => {
          if (editing) patchCredential(credential)
          reload()
        }}
      />
      <RevealCredentialDialog
        credential={revealing}
        open={Boolean(revealing)}
        onClose={() => setRevealing(null)}
      />
      <RotateCredentialDialog
        credential={rotating}
        open={Boolean(rotating)}
        onClose={() => setRotating(null)}
        onRotated={(credential) => {
          patchCredential(credential)
          reload()
        }}
      />
      <ImportCredentialsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={reload}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={working}
        title="Delete credential?"
        description={
          deleting
            ? `${deleting.name} will be permanently removed from your encrypted vault. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete credential"
      />
    </div>
  )
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.07em] text-slate-500">
      {children}
    </th>
  )
}

function CredentialStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof KeyRound
  label: string
  value: number
  tone: 'brand' | 'success' | 'amber' | 'violet'
}) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600 ring-brand-100',
    success: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100',
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-[var(--shadow-card)]">
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset', tones[tone])}>
        <Icon className="h-4 w-4" strokeWidth={1.9} />
      </span>
      <div className="min-w-0">
        <p className="text-[10.5px] font-medium text-muted">{label}</p>
        <p className="mt-0.5 text-[20px] font-bold leading-none tracking-[-0.03em] text-ink">{value}</p>
      </div>
    </div>
  )
}

function HealthRow({
  label,
  value,
  total,
  tone,
}: {
  label: string
  value: number
  total: number
  tone: string
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] text-slate-600">{label}</span>
        <span className="text-[10.5px] font-semibold text-slate-500">{value}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function CredentialTableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border border-line p-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-2.5 w-24" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}
