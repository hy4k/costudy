/**
 * Stacked background layers that give every section depth and atmosphere.
 * Pinned with `position: fixed` so they parallax under content.
 */
export function AmbientBackground() {
  return (
    <>
      <div className="ambient-bg" aria-hidden />
      <div className="grid-bg" aria-hidden />
    </>
  );
}
