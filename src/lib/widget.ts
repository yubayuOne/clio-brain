import { Platform } from 'react-native';

type WidgetModule = typeof import('@/widget');

let mod: WidgetModule | null | undefined;

/**
 * The widget library throws on import when its native module is missing (Expo Go,
 * iOS, web), so it is loaded lazily and the app runs without the widget there.
 */
export function widgetModule(): WidgetModule | null {
  if (mod === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = Platform.OS === 'android' ? (require('@/widget') as WidgetModule) : null;
    } catch {
      mod = null;
    }
  }
  return mod;
}
