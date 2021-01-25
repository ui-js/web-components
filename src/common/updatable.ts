export interface Updatable {
  update(): void;
}

const gDirtyList = new Set<Updatable>();
let gTimer = 0;

export function dirty(updatable: Updatable): void {
  gDirtyList.add(updatable);

  // If there's already a pending timer, bail
  if (gTimer !== 0) return;

  // Request a timer
  gTimer = requestAnimationFrame(() => {
    gTimer = 0;
    const xs = [...gDirtyList.values()];
    gDirtyList.clear();
    for (const x of xs) x.update();
  });
}
