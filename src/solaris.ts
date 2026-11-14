import { base, destinations, exhibits, sourceLabels, sources, type Page } from './catalog';
import type { SourceId } from './references.mjs';
import { icon } from './ui';

type MissionContext = {
  phase: string;
  observed: number[];
  collected: string[];
  fitted: string[];
  attempts: number;
  hints: number;
  selection?: string;
  cutscene: boolean;
  flight?: { altitude:number; records:{id:string;samples:number;uncertainty:number;locked:boolean}[] };
};
export type SolarisContext = {
  view: Page;
  subject: string;
  selection?: string;
  mission?: () => MissionContext;
  hint?: () => string;
  history?: () => readonly string[];
  pause?: (paused: boolean) => void;
};
type Message = { role: 'user' | 'assistant'; text: string; citations: SourceId[] };
const storageKey = 'signal-solaris-v1';

function loadMessages(): Message[] {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]');
    if (!Array.isArray(saved)) return [];
    return saved.flatMap(row => {
      if (!row || !['user','assistant'].includes(row.role) || typeof row.text !== 'string') return [];
      const citations = Array.isArray(row.citations) ? row.citations.filter((id: unknown) => typeof id === 'string' && Object.hasOwn(sources, id)) : [];
      return [{ role: row.role, text: row.text.slice(0,800), citations }];
    }).slice(-30);
  } catch {
    return [];
  }
}

function authoredAnswer(context: SolarisContext) {
  if (context.hint) return { text: context.hint(), citations: [] };
  if (context.view === 'moon' || context.view === 'mars') {
    const view = context.view;
    const world = destinations[view];
    const site = world.sites.find(item => item.id === context.selection);
    if (site) return { text: site.detail, citations: [view === 'moon' ? 'lunarRover' : 'mer'] as SourceId[] };
    return { text: view === 'moon' ? 'Try finding Apollo 15 near Hadley Rille. I can point out the rover once you select the site.' : 'Look for Opportunity’s marker at Eagle Crater. The rocks there helped reveal ancient water.', citations: [view === 'moon' ? 'lunarRover' : 'mer'] as SourceId[] };
  }
  if (context.view === 'opportunity' || context.view === 'lunar') {
    const exhibit = exhibits[context.view];
    const part = exhibit.instruments.find(item => item.id === context.selection);
    return { text: part?.detail ?? exhibit.overview, citations: [context.view === 'lunar' ? 'lunarRover' : 'mer'] as SourceId[] };
  }
  if (context.view === 'experiment') return { text: 'Raise the dust level until the panels produce less than the rover needs. Below that point the battery charges. Above it the battery drains.', citations: ['mer'] as SourceId[] };
  if (context.view === 'compare') return { text: 'The same rover would weigh less on the Moon than on Mars. That changes how its wheels press into the surface.', citations: ['archive'] as SourceId[] };
  if (context.view === 'collection') return { text: 'Only a completed reconstruction appears here. Open the public exhibit any time to compare the hardware with your work.', citations: [] };
  return { text: 'I’m Solaris. Open the atlas to explore the Moon or Mars, or join Astra to trace a signal and rebuild Opportunity.', citations: [] };
}

export const solarisMarkup = () => `<dialog class="solaris-dialog" id="solaris-panel" aria-labelledby="solaris-title">
  <div class="dialog-bar"><div>${icon('solaris',22)}<h2 id="solaris-title">Solaris</h2></div>
    <button type="button" id="close-solaris" class="close" aria-label="Close Solaris">×</button></div>
  <p id="chat-context" class="chat-context"></p>
  <ol class="chat-messages" id="chat-messages" aria-label="Conversation" aria-live="polite"></ol>
  <div class="chat-tools"><button class="button outline" type="button" id="solaris-hint">View notes</button></div>
  <p class="chat-status" id="solaris-status" role="status" hidden></p>
  <form id="solaris-form" class="solaris-form"><label>Ask Solaris
    <input name="message" maxlength="360" autocomplete="off" placeholder="Ask about this view" required></label>
    <button class="button primary" type="submit">Send</button></form>
  <details class="chat-log" id="solaris-scene-log" hidden><summary>Scene dialogue</summary><ol id="solaris-lines"></ol></details>
</dialog>`;

export function mountSolaris(context: SolarisContext) {
  const panel = document.querySelector<HTMLDialogElement>('#solaris-panel')!;
  const form = document.querySelector<HTMLFormElement>('#solaris-form')!;
  const input = form.elements.namedItem('message') as HTMLInputElement;
  const submit = form.querySelector<HTMLButtonElement>('button')!;
  const messages = document.querySelector<HTMLOListElement>('#chat-messages')!;
  const status = document.querySelector<HTMLElement>('#solaris-status')!;
  const tools = document.querySelector<HTMLButtonElement>('#solaris-hint')!;
  const transcript = document.querySelector<HTMLElement>('#solaris-scene-log')!;
  const transcriptLines = document.querySelector<HTMLOListElement>('#solaris-lines')!;
  const endpoint = base + 'api/solaris';
  let history = loadMessages();
  let returnFocus: HTMLElement | null = null;
  let suspended: HTMLDialogElement | null = null;
  let pending = false;
  const trigger = document.querySelector<HTMLButtonElement>('.topbar [data-open-solaris]')!;
  const original = document.createComment('Solaris control');
  trigger.before(original);
  const topDialogs: HTMLDialogElement[] = [];
  for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog:has([data-chat-slot])')) {
    const show = dialog.showModal.bind(dialog);
    dialog.showModal = () => {
      dialog.querySelector('[data-chat-slot]')!.append(trigger);
      topDialogs.push(dialog);
      show();
    };
    dialog.addEventListener('close', () => {
      const index = topDialogs.indexOf(dialog);
      if (index !== -1) topDialogs.splice(index, 1);
      const last = topDialogs.at(-1);
      if (last?.open) last.querySelector('[data-chat-slot]')!.append(trigger);
      else original.after(trigger);
    });
  }

  function updateMessages() {
    messages.replaceChildren(...history.map(turn => {
      const item = document.createElement('li');
      item.dataset.role = turn.role;
      const author = document.createElement('b');
      author.textContent = turn.role === 'assistant' ? 'Solaris' : 'You';
      const line = document.createElement('p');
      line.textContent = turn.text;
      item.append(author, line);
      for (const id of turn.citations) {
        const link = document.createElement('a');
        link.href = sources[id];
        link.textContent = sourceLabels[id] + ' ↗';
        link.className = 'source';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        item.append(link);
      }
      return item;
    }));
    messages.scrollTop = messages.scrollHeight;
  }

  function append(message: Message) {
    history = [...history, message].slice(-30);
    try { sessionStorage.setItem(storageKey, JSON.stringify(history)); } catch { /* The chat remains available for this page. */ }
    updateMessages();
  }

  function setStatus(message = '') {
    status.textContent = message;
    status.hidden = !message;
  }

  function updateContext() {
    document.querySelector<HTMLElement>('#chat-context')!.textContent = context.subject;
    tools.textContent = context.hint ? 'Request hint' : 'View notes';
    const lines = context.history?.();
    transcript.hidden = !lines?.length;
    transcriptLines.replaceChildren(...(lines ?? []).map(value => {
      const line = document.createElement('li');
      line.textContent = value;
      return line;
    }));
  }

  function open(trigger: HTMLElement) {
    if (panel.open) return;
    returnFocus = trigger;
    updateContext();
    updateMessages();
    context.pause?.(true);
    // The underlying task keeps its state, but only one dialog is visible.
    suspended = document.querySelector<HTMLDialogElement>('dialog[open]');
    suspended?.setAttribute('data-suspended', '');
    panel.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    // The keyboard stays closed on phones until the visitor chooses the message field.
    panel.querySelector<HTMLButtonElement>('#close-solaris')!.focus();
    void fetch(endpoint, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(4000) })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        if (!pending && panel.open) setStatus(data?.live ? '' : 'Live replies are offline. Notes and mission hints are available.');
      })
      .catch(() => {
        if (!pending && panel.open) setStatus('Live replies are offline. Notes and mission hints are available.');
      });
  }
  document.addEventListener('click', event => {
    const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-open-solaris]');
    if (trigger) open(trigger);
  });
  panel.querySelector<HTMLButtonElement>('#close-solaris')!.addEventListener('click', () => panel.close());
  panel.addEventListener('close', () => {
    suspended?.removeAttribute('data-suspended');
    suspended = null;
    context.pause?.(false);
    returnFocus?.setAttribute('aria-expanded', 'false');
    if (returnFocus && returnFocus.getClientRects().length && !returnFocus.matches(':disabled')) returnFocus.focus();
  });
  tools.addEventListener('click', () => {
    const reply = authoredAnswer(context);
    append({ role: 'assistant', ...reply });
    updateContext();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || pending) return;
    append({ role: 'user', text: message, citations: [] });
    input.value = '';
    pending = true;
    submit.disabled = true;
    setStatus('Waiting for Solaris…');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        signal: AbortSignal.timeout(14000),
        body: JSON.stringify({
          view: context.view,
          selection: context.selection,
          mission: context.mission?.(),
          history: history.slice(-7).map(turn => ({ role: turn.role, text: turn.text })),
        }),
      });
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('Empty reply');
      const citations: SourceId[] = Array.isArray(data.citations) ? data.citations.filter((id: unknown) => typeof id === 'string' && Object.hasOwn(sources, id)).slice(0,3) : [];
      append({ role: 'assistant', text: data.reply.slice(0, 800), citations });
      setStatus();
    } catch {
      setStatus('Live reply unavailable. Use ' + (context.hint ? 'Request hint' : 'View notes') + ' to continue.');
    } finally {
      pending = false;
      submit.disabled = false;
      if (panel.open) input.focus();
    }
  });
}
