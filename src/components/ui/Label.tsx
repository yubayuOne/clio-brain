import { Text } from 'react-native';

/** Small uppercase caption above a field or group. `className` overrides the default margin. */
export function Label({
  children,
  nativeID,
  className = 'mb-1',
}: {
  children: string;
  nativeID?: string;
  className?: string;
}) {
  return (
    <Text nativeID={nativeID} className={`font-head text-xs uppercase tracking-widest text-mute ${className}`}>
      {children}
    </Text>
  );
}
