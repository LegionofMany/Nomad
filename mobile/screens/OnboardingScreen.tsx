/**
 * First-run flow for phones.
 *
 *  Create : welcome -> password -> time key -> backup (24 Time Sets) -> confirm -> open wallet
 *  Recover: welcome -> enter 24 Time Sets -> password -> check the address -> time key -> open wallet
 *           (or "import recovery words" from another wallet)
 *
 * The Time Sets live only in this screen's memory. They are never saved or logged.
 * Every message appears right next to the button that caused it.
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAppState } from '../state/appState';
import * as walletService from '../services/walletService';
import { validateMnemonic } from '../../src/wallet-core/seed';
import { TIME_SET_COUNT, currentRecoveryProfile, formatTimeSet, parseTimeSets, validateTimeSets } from '../../src/security/timeSets';
import type { TimeSet } from '../../src/security/timeSets';
import { C, NomadBrandMark } from '../ui/NomadShell';

type Step = 'welcome' | 'import' | 'password' | 'timekey' | 'creating' | 'backup' | 'confirm' | 'verify' | 'done';
type Mode = 'create' | 'import';
type ImportKind = 'timesets' | 'words';

const pad2 = (n: number) => String(n).padStart(2, '0');
const normalizePhrase = (s: string) => s.trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');
const shortAddress = (a: string) => (a.length > 14 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

function pickQuiz(count: number): number[] {
  const picked = new Set<number>();
  while (picked.size < 3) picked.add(Math.floor(Math.random() * count));
  return [...picked].sort((a, b) => a - b);
}

function ErrorBox({ error }: { error: string }) {
  return error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null;
}

function Primary({ label, onPress, disabled, busy }: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled || busy} onPress={onPress} style={[s.primary, (disabled || busy) && s.primaryOff]}>
      <Text style={s.primaryText}>{label}</Text>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const { unlockWithClock, refresh } = useAppState();
  const now = useMemo(() => new Date(), []);

  const [step, setStep] = useState<Step>('welcome');
  const [mode, setMode] = useState<Mode>('create');
  const [importKind, setImportKind] = useState<ImportKind>('timesets');
  const [phraseInput, setPhraseInput] = useState('');
  const [setsInput, setSetsInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [hour, setHour] = useState(pad2(now.getHours()));
  const [minute, setMinute] = useState(pad2(now.getMinutes()));
  const [second, setSecond] = useState(pad2(now.getSeconds()));
  const [timeSets, setTimeSets] = useState<TimeSet[]>([]);
  const [createdAddress, setCreatedAddress] = useState('');
  const [recovered, setRecovered] = useState<{ mnemonic: string; evmAddress: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [quiz, setQuiz] = useState<number[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const clockTime = () => ({ hour: Number(hour), minute: Number(minute), second: Number(second) });
  const parsedSets = useMemo(() => parseTimeSets(setsInput), [setsInput]);
  const testProfile = currentRecoveryProfile() === 'test';

  /** Shows the progress page while heavy work runs, then goes to `onFail` if it throws. */
  const runWithProgress = async (firstStage: string, work: () => Promise<void>, onFail: Step) => {
    Keyboard.dismiss();
    setError('');
    setBusy(true);
    setStage(firstStage);
    setElapsed(0);
    setStep('creating');
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    await new Promise((resolve) => setTimeout(resolve, 250)); // let the progress screen draw before the heavy work
    try {
      await work();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStep(onFail);
    } finally {
      clearInterval(timer);
      setBusy(false);
    }
  };

  const start = (next: Mode) => {
    setMode(next);
    setImportKind('timesets');
    setError('');
    setStep(next === 'import' ? 'import' : 'password');
  };

  const submitImport = () => {
    if (importKind === 'words') {
      if (!validateMnemonic(normalizePhrase(phraseInput))) {
        return setError('That recovery phrase is not valid. Check the words and their order, then try again.');
      }
      setError('');
      return setStep('password');
    }
    if (parsedSets.problems.length > 0) {
      const shown = parsedSets.problems.slice(0, 3).join(', ');
      return setError(`These could not be read as times: ${shown}${parsedSets.problems.length > 3 ? '…' : ''}. Each Time Set looks like 13:05:22.`);
    }
    try {
      validateTimeSets(parsedSets.sets);
    } catch (err) {
      return setError(err instanceof Error ? err.message : 'Check your Time Sets.');
    }
    setError('');
    setStep('password');
  };

  const submitPassword = () => {
    if (password.length < 12) return setError('Your password needs at least 12 characters.');
    if (mode === 'create' && password !== confirmPw) return setError('The two passwords do not match.');
    setError('');
    if (mode === 'import' && importKind === 'timesets') {
      void runWithProgress('Rebuilding your wallet from your Time Sets…', async () => {
        const result = await walletService.deriveWalletFromTimeSets(parsedSets.sets, password, setStage);
        setRecovered(result);
        setStep('verify');
      }, 'password');
      return;
    }
    setStep('timekey');
  };

  const submitTime = () => {
    const valid = /^\d{1,2}$/.test(hour) && /^\d{1,2}$/.test(minute) && /^\d{1,2}$/.test(second)
      && Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59;
    if (!valid) return setError('Enter a real 24-hour time: hour 0-23, minute 0-59, second 0-59.');
    void runWithProgress('Starting…', async () => {
      if (mode === 'create') {
        const res = await walletService.createWallet(password, clockTime(), setStage);
        setTimeSets(res.timeSets);
        setCreatedAddress(res.evmAddress);
        setQuiz(pickQuiz(res.timeSets.length));
        setAnswers(['', '', '']);
        setRevealed(false);
        setStep('backup');
      } else if (importKind === 'words') {
        await walletService.restoreWallet(normalizePhrase(phraseInput), password, clockTime());
        setPhraseInput('');
        setStep('done');
      } else {
        if (!recovered) throw new Error('Start the recovery again from the beginning.');
        await walletService.restoreWallet(recovered.mnemonic, password, clockTime());
        setRecovered(null);
        setSetsInput('');
        setStep('done');
      }
    }, 'timekey');
  };

  const submitConfirm = () => {
    const ok = quiz.every((index, i) => {
      const typed = parseTimeSets(answers[i]);
      return typed.problems.length === 0 && typed.sets.length === 1 && formatTimeSet(typed.sets[0]) === formatTimeSet(timeSets[index]);
    });
    if (!ok) return setError('One or more Time Sets do not match. Go back and check what you wrote down.');
    setError('');
    setTimeSets([]);
    setRevealed(false);
    setStep('done');
  };

  const openWallet = async () => {
    setBusy(true);
    setError('');
    try {
      const result: any = await unlockWithClock(clockTime(), password);
      if (!result?.ok) {
        setError('Your wallet is ready, but it could not open right now. Continue to the unlock screen.');
        await refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the wallet.');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    setError('');
    if (step === 'import') setStep('welcome');
    else if (step === 'password') setStep(mode === 'import' ? 'import' : 'welcome');
    else if (step === 'timekey') setStep(mode === 'import' && importKind === 'timesets' ? 'verify' : 'password');
    else if (step === 'confirm') setStep('backup');
    else if (step === 'verify') {
      setRecovered(null);
      setStep('password');
    }
  };

  const showBack = step === 'import' || step === 'password' || step === 'timekey' || step === 'confirm' || step === 'verify';
  const numbers: Record<string, Partial<Record<Step, number>>> = {
    create: { password: 1, timekey: 2, creating: 2, backup: 3, confirm: 4, done: 5 },
    words: { import: 1, password: 2, timekey: 3, creating: 3, done: 4 },
    timesets: { import: 1, password: 2, creating: recovered ? 4 : 3, verify: 3, timekey: 4, done: 5 },
  };
  const flow = mode === 'create' ? 'create' : importKind === 'words' ? 'words' : 'timesets';
  const totalSteps = flow === 'create' ? 5 : flow === 'words' ? 4 : 4;
  const stepNumber = numbers[flow][step] ?? 0;

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.topBar}>
        {showBack ? <Pressable onPress={back} hitSlop={12}><Text style={s.backText}>‹ Back</Text></Pressable> : <View />}
        {step !== 'welcome' && step !== 'done' ? <Text style={s.stepText}>Step {Math.min(stepNumber, totalSteps)} of {totalSteps}</Text> : <View />}
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {step === 'welcome' && (
          <View style={s.center}>
            <NomadBrandMark size={84} />
            <Text style={s.brand}>Nomad</Text>
            <Text style={s.lead}>Your keys. Your money. A secure wallet for travel.</Text>
            <View style={s.testnetPill}><Text style={s.testnetText}>TESTNET BUILD · test coins only</Text></View>
            <View style={s.stack}>
              <Primary busy={busy} label="Create a new wallet" onPress={() => start('create')} />
              <Pressable accessibilityRole="button" onPress={() => start('import')} style={s.secondary}>
                <Text style={s.secondaryText}>Recover my wallet</Text>
              </Pressable>
            </View>
            <Text style={s.fine}>Nomad is non-custodial. Only you hold the keys, and nobody can recover them for you.</Text>
          </View>
        )}

        {step === 'import' && importKind === 'timesets' && (
          <View>
            <Text style={s.title}>Recover your wallet</Text>
            <Text style={s.help}>
              Type your {TIME_SET_COUNT} Time Sets exactly as written, in the same order. Put a space or a new line between them. Next you will enter your password.
            </Text>
            <TextInput
              accessibilityLabel="Your 24 Time Sets"
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              value={setsInput}
              onChangeText={setSetsInput}
              placeholder={'13:05:22\n04:47:09\n…'}
              placeholderTextColor={C.muted2}
              style={[s.input, s.phraseInput]}
            />
            <Text style={[s.check, parsedSets.sets.length === TIME_SET_COUNT && parsedSets.problems.length === 0 && s.checkOk]}>
              {parsedSets.sets.length === TIME_SET_COUNT && parsedSets.problems.length === 0 ? '✓' : '○'} {parsedSets.sets.length} of {TIME_SET_COUNT} Time Sets entered
            </Text>
            <ErrorBox error={error} />
            <Primary busy={busy} label="Continue" onPress={submitImport} disabled={!setsInput.trim()} />
            <Pressable onPress={() => { setImportKind('words'); setError(''); }} hitSlop={8} style={s.linkWrap}>
              <Text style={s.link}>Have recovery words from another wallet? Import them instead</Text>
            </Pressable>
          </View>
        )}

        {step === 'import' && importKind === 'words' && (
          <View>
            <Text style={s.title}>Import recovery words</Text>
            <Text style={s.help}>Type or paste the 12 or 24 recovery words from another wallet, with a space between each word.</Text>
            <TextInput
              accessibilityLabel="Secret Recovery Phrase"
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              secureTextEntry={false}
              value={phraseInput}
              onChangeText={setPhraseInput}
              placeholder="word1 word2 word3 …"
              placeholderTextColor={C.muted2}
              style={[s.input, s.phraseInput]}
            />
            <ErrorBox error={error} />
            <Primary busy={busy} label="Continue" onPress={submitImport} disabled={!phraseInput.trim()} />
            <Pressable onPress={() => { setImportKind('timesets'); setError(''); }} hitSlop={8} style={s.linkWrap}>
              <Text style={s.link}>Recover with Time Sets instead</Text>
            </Pressable>
          </View>
        )}

        {step === 'password' && (
          <View>
            <Text style={s.title}>{mode === 'create' ? 'Create a password' : 'Enter your password'}</Text>
            <Text style={s.help}>
              {mode === 'create'
                ? 'This password protects the wallet on this phone. It is also part of your recovery: Nomad cannot reset it for you, and you need it together with your Time Sets.'
                : importKind === 'timesets'
                  ? 'Enter the password you chose when you created the wallet. A different password gives a different, empty wallet.'
                  : 'Choose a password to protect the wallet on this phone.'}
            </Text>
            <TextInput accessibilityLabel="Wallet password" autoCapitalize="none" autoCorrect={false} secureTextEntry={!showPw}
              value={password} onChangeText={setPassword} placeholder={mode === 'create' ? 'New password (12+ characters)' : 'Password'} placeholderTextColor={C.muted2} style={s.input} />
            {mode === 'create' ? (
              <TextInput accessibilityLabel="Confirm wallet password" autoCapitalize="none" autoCorrect={false} secureTextEntry={!showPw}
                value={confirmPw} onChangeText={setConfirmPw} placeholder="Confirm password" placeholderTextColor={C.muted2} style={s.input} />
            ) : null}
            <Pressable onPress={() => setShowPw(!showPw)} hitSlop={8}><Text style={s.link}>{showPw ? 'Hide password' : 'Show password'}</Text></Pressable>
            <Text style={[s.check, password.length >= 12 && s.checkOk]}>{password.length >= 12 ? '✓' : '○'} At least 12 characters</Text>
            {mode === 'create' ? (
              <Text style={[s.check, password.length > 0 && password === confirmPw && s.checkOk]}>{password.length > 0 && password === confirmPw ? '✓' : '○'} Passwords match</Text>
            ) : null}
            <ErrorBox error={error} />
            <Primary busy={busy} label={mode === 'import' && importKind === 'timesets' ? 'Rebuild my wallet' : 'Continue'} onPress={submitPassword} />
          </View>
        )}

        {step === 'verify' && recovered && (
          <View>
            <Text style={s.title}>Is this your wallet?</Text>
            <Text style={s.help}>
              Your Time Sets and password rebuilt a wallet with this address. Compare it with the address you saw when you created the wallet (it starts with {shortAddress(recovered.evmAddress).slice(0, 6)} and ends with {recovered.evmAddress.slice(-4)}).
            </Text>
            <View style={s.addressBox}><Text selectable style={s.addressText}>{recovered.evmAddress}</Text></View>
            <Text style={s.help}>If it is not the address you expect, a Time Set or the password was not exactly right. Go back and check them. Nothing has been saved yet.</Text>
            <Primary busy={busy} label="Yes, this is my wallet" onPress={() => { setError(''); setStep('timekey'); }} />
            <Pressable onPress={back} style={[s.secondary, { marginTop: 12 }]}><Text style={s.secondaryText}>No, go back</Text></Pressable>
          </View>
        )}

        {step === 'timekey' && (
          <View>
            <Text style={s.title}>Choose your Time Key</Text>
            <Text style={s.help}>
              Nomad adds a second lock. You open the wallet with your password plus this time of day (24-hour). It starts with the current time so you can open the wallet right away. Pick a time you will remember. This is separate from your 24 recovery Time Sets.
            </Text>
            <View style={s.timeRow}>
              {([['HOUR', hour, setHour], ['MIN', minute, setMinute], ['SEC', second, setSecond]] as const).map(([label, value, set], i) => (
                <React.Fragment key={label}>
                  {i > 0 ? <Text style={s.colon}>:</Text> : null}
                  <View style={s.timeCell}>
                    <Text style={s.timeLabel}>{label}</Text>
                    <TextInput accessibilityLabel={`Time key ${label}`} keyboardType="number-pad" maxLength={2} value={value}
                      onChangeText={(t) => set(t.replace(/[^0-9]/g, '').slice(0, 2))} style={s.timeInput} />
                  </View>
                </React.Fragment>
              ))}
            </View>
            <ErrorBox error={error} />
            <Primary busy={busy} label={mode === 'create' ? 'Create wallet' : 'Recover wallet'} onPress={submitTime} />
          </View>
        )}

        {step === 'creating' && (
          <View style={s.center}>
            <ActivityIndicator size="large" color={C.green} />
            <Text style={s.title}>{mode === 'create' ? 'Creating your wallet…' : 'Rebuilding your wallet…'}</Text>
            <Text style={s.help}>Securing your keys on this phone. This can take a little while. Please keep the app open.</Text>
            <Text style={s.stage}>{stage}</Text>
            <Text style={s.timer}>{elapsed}s</Text>
            <Text style={s.fine}>If the step number stays the same for more than 3 minutes, take a photo of this screen and send it to your developer.</Text>
          </View>
        )}

        {step === 'backup' && (
          <View>
            <Text style={s.title}>Your 24 Time Sets</Text>
            <Text style={s.help}>
              Write these {timeSets.length} times down, in order, on paper. With your password they are the only way to rebuild this wallet if you lose your phone. Anyone who has both can take your funds. Never photograph, screenshot or share them.
            </Text>
            {testProfile ? (
              <View style={s.warnBox}><Text style={s.warnText}>TEST BACKUP. It only works with test builds of Nomad. Do not rely on it for real money.</Text></View>
            ) : null}
            <View style={s.grid}>
              {timeSets.map((t, i) => (
                <View key={i} style={s.setCell}><Text style={s.wordNum}>{i + 1}</Text><Text style={s.word}>{revealed ? formatTimeSet(t) : '••:••:••'}</Text></View>
              ))}
            </View>
            <Pressable onPress={() => setRevealed(!revealed)} style={s.secondary}><Text style={s.secondaryText}>{revealed ? 'Hide Time Sets' : 'Tap to reveal Time Sets'}</Text></Pressable>
            <Text style={s.help}>{'\n'}Also note your wallet address, so you can check it after a recovery: {shortAddress(createdAddress)}</Text>
            <Primary busy={busy} label="I have written them down" onPress={() => { setRevealed(false); setStep('confirm'); }} disabled={timeSets.length === 0} />
          </View>
        )}

        {step === 'confirm' && (
          <View>
            <Text style={s.title}>Confirm your Time Sets</Text>
            <Text style={s.help}>Type the Time Sets below, as you wrote them (like 13:05:22), to prove you saved them. Use “Back” if you need another look.</Text>
            {quiz.map((index, i) => (
              <TextInput key={index} accessibilityLabel={`Time Set number ${index + 1}`} autoCapitalize="none" autoCorrect={false}
                keyboardType="numbers-and-punctuation" value={answers[i]} onChangeText={(t) => setAnswers(answers.map((a, j) => (j === i ? t : a)))}
                placeholder={`Time Set #${index + 1} (HH:MM:SS)`} placeholderTextColor={C.muted2} style={s.input} />
            ))}
            <ErrorBox error={error} />
            <Primary busy={busy} label="Confirm" onPress={submitConfirm} />
          </View>
        )}

        {step === 'done' && (
          <View style={s.center}>
            <Text style={s.bigCheck}>✓</Text>
            <Text style={s.title}>Your wallet is ready</Text>
            <Text style={s.help}>{mode === 'create' ? 'Your Time Sets are confirmed. ' : 'Your wallet was rebuilt. '}You are on the Bitcoin testnet, so everything here uses free test coins.</Text>
            <ErrorBox error={error} />
            <Primary busy={busy} label={busy ? 'Opening…' : 'Open my wallet'} onPress={() => void openWallet()} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, minHeight: 44 },
  backText: { color: C.blue, fontSize: 16, fontWeight: '700' },
  stepText: { color: C.muted2, fontSize: 12 },
  body: { flexGrow: 1, padding: 22, paddingBottom: 48 },
  center: { alignItems: 'center', paddingTop: 24 },
  brand: { color: '#fff', fontSize: 40, fontWeight: '900', marginTop: 14 },
  lead: { color: C.muted, fontSize: 16, textAlign: 'center', marginTop: 10, lineHeight: 23 },
  testnetPill: { marginTop: 18, borderWidth: 1, borderColor: C.orange, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  testnetText: { color: C.orange, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  stack: { alignSelf: 'stretch', marginTop: 36, gap: 12 },
  fine: { color: C.muted2, fontSize: 12, textAlign: 'center', marginTop: 26, lineHeight: 18 },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 12, marginBottom: 8, textAlign: 'left' },
  help: { color: C.muted, fontSize: 14, lineHeight: 21, marginBottom: 18 },
  input: { minHeight: 52, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.panel2, color: '#fff', paddingHorizontal: 14, fontSize: 16, marginBottom: 12 },
  phraseInput: { minHeight: 130, paddingTop: 14, textAlignVertical: 'top' },
  link: { color: C.blue, fontSize: 14, marginBottom: 14 },
  linkWrap: { marginTop: 18, alignItems: 'center' },
  check: { color: C.muted2, fontSize: 14, marginBottom: 6 },
  checkOk: { color: C.green },
  primary: { minHeight: 54, borderRadius: 999, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryOff: { opacity: 0.45 },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  secondary: { minHeight: 54, borderRadius: 999, borderWidth: 1.5, borderColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: C.blue, fontSize: 16, fontWeight: '800' },
  errorBox: { borderWidth: 1, borderColor: C.red, backgroundColor: 'rgba(255,75,75,.12)', borderRadius: 12, padding: 12, marginTop: 6 },
  errorText: { color: '#ff9a9a', fontSize: 14, lineHeight: 20 },
  warnBox: { borderWidth: 1, borderColor: C.orange, backgroundColor: 'rgba(255,150,0,.12)', borderRadius: 12, padding: 12, marginBottom: 14 },
  warnText: { color: C.orange, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  addressBox: { borderWidth: 1, borderColor: C.green, backgroundColor: C.panel2, borderRadius: 12, padding: 14, marginBottom: 16 },
  addressText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  timeCell: { flex: 1 },
  timeLabel: { color: C.muted2, fontSize: 11, textAlign: 'center', marginBottom: 6 },
  timeInput: { minHeight: 64, borderWidth: 1.5, borderColor: C.green, borderRadius: 12, backgroundColor: C.panel2, color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  colon: { color: '#fff', fontSize: 28, marginHorizontal: 8, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  setCell: { width: '48%', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.borderSoft, backgroundColor: C.panel2, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 10 },
  wordNum: { color: C.muted2, fontSize: 12, width: 24 },
  word: { color: '#fff', fontSize: 16, fontWeight: '700' },
  stage: { color: C.green, fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  timer: { color: C.muted2, fontSize: 14, marginTop: 8 },
  bigCheck: { color: C.green, fontSize: 64, fontWeight: '900' },
});
