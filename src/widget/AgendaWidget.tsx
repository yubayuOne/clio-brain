import { FlexWidget, OverlapWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import { formatDay, formatTime } from '@/lib/text';
import { canvas, colors, fonts } from '@/theme/tokens';
import type { Agenda, AgendaEntry } from './agenda';

const itemUri = (id: string) => `cliobrain://item/${encodeURIComponent(id)}`;

/** The canvas dot grid, drawn once as an SVG the size of the widget. */
function dots(width: number, height: number): string {
  const g = canvas.gridSize / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><pattern id="d" width="${g}" height="${g}" patternUnits="userSpaceOnUse"><circle cx="${g / 2}" cy="${g / 2}" r="1" fill="${colors.dot}"/></pattern></defs><rect width="100%" height="100%" fill="url(#d)"/></svg>`;
}

function NextNote({ next, now }: { next: AgendaEntry | null; now: number }) {
  const today = next && new Date(next.at).toDateString() === new Date(now).toDateString();
  return (
    <OverlapWidget
      style={{ width: 'match_parent', height: 'match_parent', rotation: -2 }}
      clickAction={next ? 'OPEN_URI' : 'OPEN_APP'}
      clickActionData={next ? { uri: itemUri(next.id) } : undefined}
      accessibilityLabel={next ? `Next reminder: ${next.title} at ${formatTime(next.at)}` : 'No upcoming reminders'}
    >
      <FlexWidget style={{ width: 'match_parent', height: 'match_parent', paddingTop: 5 }}>
        <FlexWidget
          style={{
            width: 'match_parent',
            height: 'match_parent',
            backgroundColor: colors.paper,
            borderRadius: 2,
            padding: 12,
            flexDirection: 'column',
          }}
        >
          <TextWidget
            text={next && !today ? formatDay(next.at).toUpperCase() : 'NEXT'}
            style={{ fontFamily: fonts.head, fontSize: 11, letterSpacing: 0.15, color: colors.red }}
          />
          <TextWidget
            text={next ? formatTime(next.at) : '--:--'}
            style={{ fontFamily: fonts.headBold, fontSize: 30, color: colors.text, marginTop: 2 }}
          />
          <TextWidget
            text={(next ? next.title : 'No upcoming reminders').toUpperCase()}
            maxLines={3}
            truncate="END"
            style={{ fontFamily: fonts.head, fontSize: 14, lineHeight: 17, color: colors.text, marginTop: 6 }}
          />
        </FlexWidget>
      </FlexWidget>
      {/* Pin straddling the top edge, as on board cards. */}
      <FlexWidget style={{ width: 'match_parent', alignItems: 'center' }}>
        <FlexWidget style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.red }} />
      </FlexWidget>
    </OverlapWidget>
  );
}

function LaterRow({ entry }: { entry: AgendaEntry }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: itemUri(entry.id) }}
      accessibilityLabel={`${entry.title} at ${formatTime(entry.at)}`}
      style={{
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
    >
      <TextWidget
        text={formatTime(entry.at)}
        style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.dim, width: 48 }}
      />
      <FlexWidget style={{ flex: 1 }}>
        <TextWidget
          text={entry.title.toUpperCase()}
          maxLines={1}
          truncate="END"
          style={{ fontFamily: fonts.head, fontSize: 14, color: colors.paper }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

/** Home screen widget (4x2): the next reminder as a pinned note, the rest of today beside it. */
export function AgendaWidget({
  agenda,
  now,
  width,
  height,
}: {
  agenda: Agenda;
  now: number;
  width: number;
  height: number;
}) {
  const rows = Math.max(0, Math.floor((height - 96) / 32));
  return (
    <OverlapWidget
      clickAction="OPEN_APP"
      accessibilityLabel="Clio Brain reminders"
      style={{ width: 'match_parent', height: 'match_parent', backgroundColor: colors.canvas, borderRadius: 18 }}
    >
      <SvgWidget svg={dots(width, height)} style={{ width, height }} />
      <FlexWidget style={{ width: 'match_parent', height: 'match_parent', flexDirection: 'row', padding: 12 }}>
        <FlexWidget style={{ width: Math.round(width * 0.42), height: 'match_parent', paddingVertical: 4 }}>
          <NextNote next={agenda.next} now={now} />
        </FlexWidget>

        <FlexWidget style={{ flex: 1, height: 'match_parent', flexDirection: 'column', paddingLeft: 14 }}>
          <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', alignItems: 'center' }}>
            <TextWidget
              text="CLIO BRAIN"
              style={{ fontFamily: fonts.headBold, fontSize: 14, letterSpacing: 0.12, color: colors.paper }}
            />
            <FlexWidget
              style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.red, marginLeft: 5, marginTop: 2 }}
            />
            <FlexWidget style={{ flex: 1 }} />
            <TextWidget
              text={`${agenda.today} today`}
              style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.dim }}
            />
          </FlexWidget>

          <FlexWidget style={{ width: 'match_parent', flex: 1, flexDirection: 'column', marginTop: 4 }}>
            {agenda.later.slice(0, rows).map((e) => (
              <LaterRow key={e.id} entry={e} />
            ))}
            {agenda.later.length === 0 ? (
              <TextWidget
                text="Nothing else today."
                style={{ fontFamily: fonts.mono, fontSize: 12, color: colors.dim, marginTop: 8 }}
              />
            ) : null}
          </FlexWidget>

          <FlexWidget style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'flex-end' }}>
            <FlexWidget
              clickAction="OPEN_URI"
              clickActionData={{ uri: 'cliobrain://capture' }}
              accessibilityLabel="Pin new item"
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.red,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TextWidget text="+" style={{ fontFamily: fonts.head, fontSize: 26, color: colors.paper }} />
            </FlexWidget>
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
    </OverlapWidget>
  );
}
