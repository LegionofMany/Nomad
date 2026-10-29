import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'README.md',
  'package.json',
  'vercel.json',
  'public/index.html',
  'whitepaper/Nomad_Whitepaper_v1.md',
  'docs/samourai-reference-map.md',
  'docs/security/TIME_CLOCK_AUTHORITY.md',
  'android-nomad/app/src/main/java/protocols/voltaire/nomad/security/StrictOwnerConfirmationGateway.kt',
  'android-nomad/app/src/main/java/protocols/voltaire/nomad/security/VoltaireSovereigntyPolicy.kt',
  'android-nomad/app/src/main/java/protocols/voltaire/nomad/travel/RegionalStableAssetResolver.kt',
  'android-nomad/app/src/main/java/protocols/voltaire/nomad/travel/TravelPaymentScenario.kt'
];

const requiredText = [
  {
    path: 'android-nomad/app/src/main/java/protocols/voltaire/nomad/di/NomadServiceContainer.kt',
    snippets: [
      'StrictOwnerConfirmationGateway',
      'ownerConfirmationAutoConfirmEnabled = false',
      'NomadTimeClockValidator'
    ]
  },
  {
    path: 'android-nomad/app/src/main/java/protocols/voltaire/nomad/security/VoltaireSovereigntyPolicy.kt',
    snippets: [
      'Request is not approval',
      'Time clock authority required',
      'Travel Pocket only',
      'No silent signing'
    ]
  },
  {
    path: 'docs/samourai-reference-map.md',
    snippets: [
      'Samourai-Wallet/samourai-wallet-android',
      'Features not to carry forward',
      'Do not overwrite the existing Expo/TypeScript Nomad app'
    ]
  }
];

const errors = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) errors.push(`Missing required file: ${file}`);
}

for (const check of requiredText) {
  if (!existsSync(check.path)) {
    errors.push(`Missing text-check file: ${check.path}`);
    continue;
  }
  const content = readFileSync(check.path, 'utf8');
  for (const snippet of check.snippets) {
    if (!content.includes(snippet)) {
      errors.push(`Missing snippet in ${check.path}: ${snippet}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Nomad full-stack verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Nomad full-stack verification passed.');
