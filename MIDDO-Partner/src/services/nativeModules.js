import { NativeModules, TurboModuleRegistry } from 'react-native';

export function getNativeModule(name) {
  return (
    NativeModules?.[name] ||
    TurboModuleRegistry?.get?.(name) ||
    null
  );
}
