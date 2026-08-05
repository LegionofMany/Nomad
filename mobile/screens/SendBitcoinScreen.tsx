import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useNomadWallet } from '../nomad';

type DraftStatus = 'idle' | 'creating' | 'created' | 'failed';
type FeeChoice = 'Economy' | 'Standard' | 'Priority';
type NetworkChoice = 'Bitcoin Mainnet' | 'Bitcoin Testnet';

const BTC_USD = 61410;
const AVAILABLE_BTC = 0.3567;

const feeOptions