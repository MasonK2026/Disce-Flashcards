import { useState } from 'react';
import { Copy, Check, Eye, EyeOff, RefreshCw, LogOut, KeyRound, UserPlus, TriangleAlert } from 'lucide-react';
import { useAccountStore } from '../stores/accountStore';
import { useUserStore } from '../stores/userStore';
import { useDeckStore } from '../stores/deckStore';

/** Repeated digits (111111), straight runs (123456 / 654321) and a few classics. */
function isWeakPin(pin: string): boolean {
  if (/^(\d)\1{5}$/.test(pin)) return true;
  if ('0123456789'.includes(pin) || '9876543210'.includes(pin)) return true;
  return ['121212', '112233', '123123', '696969', '420420'].includes(pin);
}

export function AccountPage() {
  const { pin, status, error, lastSyncedAt, dirty, createAccount, login, logout, syncFromCloud, pushToCloud } =
    useAccountStore();
  const [pinInput, setPinInput] = useState('');
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [justCreated, setJustCreated] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const busy = status === 'syncing';

  const hasLocalData = () =>
    Object.keys(useUserStore.getState().cardProgress).length > 0 ||
    useDeckStore.getState().customCards.length > 0 ||
    useDeckStore.getState().decks.some(d => d.cardIds.length > 0);

  const copyPin = async () => {
    if (!pin) return;
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable; the PIN is visible on screen anyway */
    }
  };

  const handleCreateRandom = async () => {
    if (await createAccount()) {
      setJustCreated(true);
      setReveal(true);
    }
  };

  const handleCreateChosen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6 || newPin !== confirmPin) return;
    if (await createAccount(newPin)) {
      setNewPin('');
      setConfirmPin('');
      setJustCreated(true);
      setReveal(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasLocalData() && !window.confirm('Logging in replaces the progress and decks stored on this device with the data saved under that PIN. Continue?')) {
      return;
    }
    if (await login(pinInput)) {
      setPinInput('');
      setJustCreated(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Log out? This device\'s progress and decks will be cleared (they stay saved in the cloud under your PIN).')) return;
    const ok = await logout();
    if (ok) {
      setReveal(false);
      setJustCreated(false);
    }
  };

  const statusText = () => {
    if (busy) return 'Syncing…';
    if (status === 'error') return 'Sync error';
    if (dirty) return 'Changes waiting to sync';
    return 'Up to date';
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Save your progress, favorites, decks and custom cards to the cloud and pick them up on any device with a 6-digit PIN.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!pin ? (
        <div className="space-y-4">
          <form onSubmit={handleCreateChosen} className="p-5 rounded-2xl border bg-card space-y-3">
            <div className="flex items-center space-x-2 font-bold">
              <UserPlus className="w-5 h-5 text-primary" />
              <span>Create an account</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Pick your own 6-digit PIN. What's currently on this device will be uploaded to it.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <input
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="Choose PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="px-3 py-2 rounded-lg border bg-background font-mono tracking-[0.3em] text-lg focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:tracking-normal placeholder:text-sm"
              />
              <input
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="Confirm PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                className="px-3 py-2 rounded-lg border bg-background font-mono tracking-[0.3em] text-lg focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:tracking-normal placeholder:text-sm"
              />
            </div>
            {confirmPin.length === 6 && newPin !== confirmPin && (
              <p className="text-xs text-red-600 dark:text-red-400">The PINs don't match.</p>
            )}
            {newPin.length === 6 && isWeakPin(newPin) && (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                That PIN is very easy to guess, and anyone who guesses it can open your account. Consider something less obvious.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={busy || newPin.length !== 6 || newPin !== confirmPin}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60"
              >
                {busy ? 'Working…' : 'Create account'}
              </button>
              <button
                type="button"
                onClick={handleCreateRandom}
                disabled={busy}
                className="text-sm text-muted-foreground hover:text-primary underline-offset-2 hover:underline disabled:opacity-60"
              >
                or generate a random PIN for me
              </button>
            </div>
          </form>

          <form onSubmit={handleLogin} className="p-5 rounded-2xl border bg-card space-y-3">
            <div className="flex items-center space-x-2 font-bold">
              <KeyRound className="w-5 h-5 text-primary" />
              <span>I already have a PIN</span>
            </div>
            <div className="flex gap-2">
              <input
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="123456"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-3 py-2 rounded-lg border bg-background font-mono tracking-[0.4em] text-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="submit"
                disabled={busy || pinInput.length !== 6}
                className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary/10 transition disabled:opacity-50"
              >
                Log in
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          {justCreated && (
            <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-sm text-amber-800 dark:text-amber-200 flex space-x-3">
              <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                <strong>Write this PIN down.</strong> There's no email or recovery: anyone with the PIN can open this account, and if you lose it the data can't be restored.
              </p>
            </div>
          )}

          <div className="p-5 rounded-2xl border bg-card space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your PIN</div>
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-4xl font-bold tracking-[0.3em]">
                {reveal ? pin : '••••••'}
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setReveal(r => !r)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                  title={reveal ? 'Hide PIN' : 'Show PIN'}
                >
                  {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={copyPin} className="p-2 rounded-lg hover:bg-muted text-muted-foreground" title="Copy PIN">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground border-t pt-3 space-y-0.5">
              <div>
                Status: <span className="font-medium text-foreground">{statusText()}</span>
              </div>
              {lastSyncedAt && <div>Last synced: {new Date(lastSyncedAt).toLocaleString()}</div>}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={async () => { if (dirty) await pushToCloud(); await syncFromCloud(); }}
                disabled={busy}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-muted transition disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                <span>Sync now</span>
              </button>
              <button
                onClick={handleLogout}
                disabled={busy}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/40 transition disabled:opacity-60"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
