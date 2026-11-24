import { Text } from 'react-native';

/** Small uppercase caption above a field or group. */
export function Label({ children, nativeID }: { children: string; nativeID?: string }) {
  return (
    <Text nativeID={nativeID} className="mb-1 font-head text-xs uppercase tracking-widest text-mute">
      {children}
    </Text>
  );
}
