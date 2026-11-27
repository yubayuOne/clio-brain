import { useEffect, useRef, useState } from 'react';
import type { RichFieldHandle } from '@/components/ui/RichField';
import { htmlToText } from '@/lib/text';

const UNDO_PAUSE = 800;
const UNDO_LIMIT = 100;

export interface Draft {
  title: string;
  body: string;
}

/**
 * Title and body of a note being written, with undo. A burst of typing is one step: the
 * state before it is recorded only when the previous change is more than UNDO_PAUSE ms old.
 * Used by the edit screen and the New item sheet.
 */
export function useDraft(initial: Draft) {
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const editor = useRef<RichFieldHandle>(null);
  const history = useRef<Draft[]>([]);
  const lastChange = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  // setValue during undo echoes back through onChangeHtml; that echo is not a new undo step.
  const restoring = useRef(false);
  const opened = useRef(0);
  useEffect(() => {
    opened.current = Date.now();
  }, []);

  const record = () => {
    const now = Date.now();
    if (now - lastChange.current > UNDO_PAUSE) {
      history.current = [...history.current.slice(-(UNDO_LIMIT - 1)), { title, body }];
      setCanUndo(true);
    }
    lastChange.current = now;
  };

  const changeTitle = (t: string) => {
    record();
    setTitle(t);
  };

  const changeBody = (b: string) => {
    // The editor may echo its normalized defaultValue right after mounting: not a user edit.
    const echo = Date.now() - opened.current < 1000 && htmlToText(b) === htmlToText(body);
    if (restoring.current) restoring.current = false;
    else if (!echo) record();
    setBody(b);
  };

  /** Steps back one change and returns the restored draft, or null when there is nothing to undo. */
  const undo = (): Draft | null => {
    const prev = history.current.pop();
    if (!prev) return null;
    setTitle(prev.title);
    if (prev.body !== body) {
      restoring.current = true;
      setBody(prev.body);
      editor.current?.setValue(prev.body);
    }
    lastChange.current = 0;
    setCanUndo(history.current.length > 0);
    return prev;
  };

  return { title, body, setTitle, changeTitle, changeBody, editor, undo, canUndo };
}
