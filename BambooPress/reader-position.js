// Preserve an explicit author choice when multiple handoffs share a visual line.
export function partAtReadingLine(markers, boundary, selectedPart, fallback) {
  const passed = markers.filter(marker => marker.top <= boundary);
  const last = passed.at(-1);
  if (!last) return fallback;
  const sameLine = passed.filter(marker => Math.abs(marker.top - last.top) < 1);
  return (sameLine.find(marker => marker.id === selectedPart) || sameLine[0]).id;
}
