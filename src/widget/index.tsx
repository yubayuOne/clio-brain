import { registerWidgetTaskHandler, requestWidgetUpdate, type WidgetInfo } from 'react-native-android-widget';
import * as repo from '@/db/repo';
import { useData } from '@/store/data';
import type { Item } from '@/types';
import { AgendaWidget } from './AgendaWidget';
import { agendaOf } from './agenda';

/** Must match the widget `name` in app.json. */
const WIDGET = 'Agenda';

const render = (items: Item[], info: WidgetInfo) => {
  const now = Date.now();
  return <AgendaWidget agenda={agendaOf(items, now)} now={now} width={info.width} height={info.height} />;
};

/**
 * Runs headless when Android adds, resizes or periodically updates the widget, possibly
 * with the app closed, so it reads SQLite directly instead of the in-memory store.
 */
export function registerWidget(): void {
  registerWidgetTaskHandler(async ({ widgetAction, widgetInfo, renderWidget }) => {
    if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
    const { items } = await repo.loadAll();
    renderWidget(render(items, widgetInfo));
  });
}

/** Redraws the widget whenever what it shows changes while the app is open. */
export function startWidgetSync(): () => void {
  let last = '';
  return useData.subscribe((s) => {
    if (s.status !== 'ready') return;
    // Card drags change items every frame; only redraw when the agenda itself differs.
    const key = JSON.stringify(agendaOf(s.items, Date.now()));
    if (key === last) return;
    last = key;
    requestWidgetUpdate({ widgetName: WIDGET, renderWidget: (info) => render(s.items, info) }).catch(() => undefined);
  });
}
