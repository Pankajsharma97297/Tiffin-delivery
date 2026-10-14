import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';
export function ProgressDots({ activeStep }) {
  return (
    <View
      style={styles.progress}
      accessibilityLabel={`Step ${activeStep} of 3`}
    >
      {[1, 2, 3].map(dot => (
        <View
          key={dot}
          style={[
            styles.dot,
            activeStep === dot ? styles.dotActive : undefined,
          ]}
        />
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 16,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#eee9e2',
  },
  dotActive: {
    width: 40,
    backgroundColor: colors.orange,
  },
});
