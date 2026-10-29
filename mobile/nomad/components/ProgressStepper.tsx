import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { nomadColors } from '../theme/tokens';

type ProgressStepperProps = {
  steps: string[];
  currentStep: number;
  completedSteps?: number[];
  style?: StyleProp<ViewStyle>;
};

export function ProgressStepper({ steps, currentStep, completedSteps = [], style }: ProgressStepperProps) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, style]}>
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const active = stepNumber === currentStep;
        const complete = completedSteps.includes(stepNumber);
        const color = active || complete ? nomadColors.green : '#5a6473';

        return (
          <React.Fragment key={label}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: color, backgroundColor: active ? nomadColors.green : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: active ? '#00160a' : color, fontWeight: '900' }}>{complete && !active ? '✓' : stepNumber}</Text>
              </View>
              <Text style={{ color, textAlign: 'center', marginTop: 8, fontSize: 12, fontWeight: active ? '900' : '500' }}>{label}</Text>
            </View>
            {index < steps.length - 1 ? <Text style={{ color: '#667', fontSize: 28, marginTop: 2 }}>→</Text> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export default ProgressStepper;
