const byId = (id) => document.getElementById(id);

const els = {
  audio: byId("audio"),
  audioInput: byId("audioInput"),
  txtInput: byId("txtInput"),
  projectInput: byId("projectInput"),
  audioName: byId("audioName"),
  playBtn: byId("playBtn"),
  restartBtn: byId("restartBtn"),
  cursorLeftBtn: byId("cursorLeftBtn"),
  cursorRightBtn: byId("cursorRightBtn"),
  currentTimeInput: byId("currentTimeInput"),
  audioDelayInput: byId("audioDelayInput"),
  playbackRateInput: byId("playbackRateInput"),
  pluckPitchInput: byId("pluckPitchInput"),
  pluckVolumeInput: byId("pluckVolumeInput"),
  seekInput: byId("seekInput"),
  divisionInput: byId("divisionInput"),
  zoomInput: byId("zoomInput"),
  snapInput: byId("snapInput"),
  tapBtn: byId("tapBtn"),
  addBpmBtn: byId("addBpmBtn"),
  extendProjectBtn: byId("extendProjectBtn"),
  undoBtn: byId("undoBtn"),
  redoBtn: byId("redoBtn"),
  deleteSelectedBtn: byId("deleteSelectedBtn"),
  validateBtn: byId("validateBtn"),
  saveProjectBtn: byId("saveProjectBtn"),
  exportBtn: byId("exportBtn"),
  normalizeBpmBtn: byId("normalizeBpmBtn"),
  clearNotesBtn: byId("clearNotesBtn"),
  fitSongBtn: byId("fitSongBtn"),
  canvas: byId("timelineCanvas"),
  placerCanvas: byId("placerCanvas"),
  overviewCanvas: byId("overviewCanvas"),
  timeReadout: byId("timeReadout"),
  selectionReadout: byId("selectionReadout"),
  gridReadout: byId("gridReadout"),
  bpmList: byId("bpmList"),
  issuesList: byId("issuesList"),
};

const ctx = els.canvas.getContext("2d");
const placerCtx = els.placerCanvas.getContext("2d");
const overviewCtx = els.overviewCanvas.getContext("2d");
const EPSILON = 0.001;
const CACHE_KEY = "dlchart.autosave.v1";
const ROW = {
  ruler: 52,
  waveformTop: 62,
  waveformHeight: 58,
};

const PLACER = {
  bpmTop: 4,
  bpmHeight: 38,
  laneTop: 46,
};

const SEGMENT_COLORS = ["#66e3ff", "#9eff72", "#ffd166", "#ff7a90", "#b78cff", "#ff9f43"];

const state = {
  audioFileName: "",
  audioObjectUrl: "",
  audioDelayMs: 0,
  durationMs: 0,
  projectEndMs: 60000,
  projectTimeMs: 0,
  isPlaying: false,
  transportStartProjectMs: 0,
  transportStartPerfMs: 0,
  audioStartedForTransport: false,
  waveform: [],
  bpmSegments: [{ id: createId(), startMs: 0, bpm: 120, division: 4, label: "" }],
  notes: [],
  division: 4,
  snapEnabled: true,
  zoom: 0.35,
  viewStartMs: 0,
  selectedNoteIds: new Set(),
  selectedBpmSegmentId: "",
  clipboard: [],
  dragging: null,
  audioDrag: null,
  overviewDrag: null,
  history: [],
  future: [],
  lastIssues: [],
  beepContext: null,
  lastBeepTimeMs: 0,
  beepedNoteIds: new Set(),
};

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatMs(value) {
  if (!Number.isFinite(value)) return "0";
  const fixed = value.toFixed(6);
  return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function formatBpm(value) {
  return formatMs(value);
}

function sortBpmSegments() {
  state.bpmSegments.sort((a, b) => a.startMs - b.startMs);
  if (!state.bpmSegments.length) {
    state.bpmSegments.push({ id: createId(), startMs: 0, bpm: 120, division: state.division, label: "" });
  }
  state.bpmSegments.forEach((segment) => {
    segment.division = Math.max(1, Math.floor(Number(segment.division) || state.division || 4));
  });
  state.bpmSegments[0].startMs = 0;
}

function getDurationMs() {
  return Math.max(
    1000,
    state.projectEndMs || 0,
    getAudioEndMs(),
    getLastNoteTime() + 4000,
    getLastBpmTime() + 4000,
  );
}

function getAudioEndMs() {
  return state.audioDelayMs + (state.durationMs || 0);
}

function setProjectEndAtLeast(timeMs) {
  state.projectEndMs = Math.max(Number(state.projectEndMs) || 0, Number(timeMs) || 0, 1000);
}

function getLastNoteTime() {
  return state.notes.reduce((max, note) => Math.max(max, note.timeMs), 0);
}

function getLastBpmTime() {
  return state.bpmSegments.reduce((max, segment) => Math.max(max, segment.startMs), 0);
}

function getViewDurationMs() {
  return Math.max(1000, getCanvasSize().width / Math.max(state.zoom, 0.000001));
}

function getMinZoom() {
  return 0.001;
}

function getFitWholeZoom() {
  return clamp(getCanvasSize().width / getDurationMs(), getMinZoom(), 3);
}

function getSegmentIndexAtTime(timeMs) {
  sortBpmSegments();
  let index = 0;
  for (let i = 0; i < state.bpmSegments.length; i += 1) {
    if (timeMs + EPSILON >= state.bpmSegments[i].startMs) index = i;
  }
  return index;
}

function getSegmentAtTime(timeMs) {
  return state.bpmSegments[getSegmentIndexAtTime(timeMs)];
}

function getSegmentEnd(index) {
  return state.bpmSegments[index + 1]?.startMs ?? getDurationMs();
}

function getSegmentDivision(segment) {
  return Math.max(1, Math.floor(Number(segment?.division) || state.division || 4));
}

function getGridMs(bpm = getSegmentAtTime(0).bpm, division = getSegmentDivision(getSegmentAtTime(0))) {
  return 60000 / bpm / division;
}

function snapTimeToGrid(timeMs) {
  sortBpmSegments();
  const index = getSegmentIndexAtTime(timeMs);
  const segment = state.bpmSegments[index];
  const segmentEnd = getSegmentEnd(index);
  const gridMs = getGridMs(segment.bpm, getSegmentDivision(segment));
  const offset = timeMs - segment.startMs;
  const snapped = segment.startMs + Math.round(offset / gridMs) * gridMs;
  return clamp(snapped, segment.startMs, segmentEnd);
}

function maybeSnap(timeMs) {
  const duration = getDurationMs();
  const clamped = clamp(timeMs, 0, duration);
  return state.snapEnabled ? snapTimeToGrid(clamped) : clamped;
}

function pushHistory() {
  state.history.push(JSON.stringify(serializeProject(false)));
  if (state.history.length > 100) state.history.shift();
  state.future = [];
  updateUndoRedoButtons();
}

function restoreSnapshot(snapshot) {
  const project = JSON.parse(snapshot);
  applyProject(project, false);
}

function undo() {
  if (!state.history.length) return;
  state.future.push(JSON.stringify(serializeProject(false)));
  restoreSnapshot(state.history.pop());
  updateUndoRedoButtons();
}

function redo() {
  if (!state.future.length) return;
  state.history.push(JSON.stringify(serializeProject(false)));
  restoreSnapshot(state.future.pop());
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  els.undoBtn.disabled = state.history.length === 0;
  els.redoBtn.disabled = state.future.length === 0;
}

function serializeProject(includeAudioName = true) {
  return {
    version: 1,
    audioFileName: includeAudioName ? state.audioFileName : "",
    durationMs: state.durationMs,
    audioDelayMs: Math.max(0, Number(state.audioDelayMs) || 0),
    bpmSegments: state.bpmSegments.map((segment) => ({ ...segment })),
    notes: state.notes.map((note) => ({ ...note })),
    editor: {
      division: state.division,
      snapEnabled: state.snapEnabled,
      zoom: state.zoom,
      viewStartMs: state.viewStartMs,
    },
  };
}

function applyProject(project, clearHistory = true) {
  state.audioFileName = project.audioFileName || state.audioFileName || "";
  state.durationMs = Number(project.durationMs) || state.durationMs || 0;
  state.audioDelayMs = Math.max(0, Number(project.audioDelayMs) || 0);
  state.bpmSegments = Array.isArray(project.bpmSegments) && project.bpmSegments.length
    ? project.bpmSegments.map((segment) => ({
        id: segment.id || createId(),
        startMs: Number(segment.startMs) || 0,
        bpm: Number(segment.bpm) || 120,
        division: Math.max(1, Math.floor(Number(segment.division) || Number(project.editor?.division) || state.division || 4)),
        label: segment.label || "",
      }))
    : [{ id: createId(), startMs: 0, bpm: 120, division: state.division, label: "" }];
  state.notes = Array.isArray(project.notes)
    ? project.notes.map((note) => ({
        id: note.id || createId(),
        timeMs: Number(note.timeMs) || 0,
        source: note.source || "manual",
      }))
    : [];
  state.division = Math.max(1, Number(project.editor?.division) || state.division || 4);
  state.snapEnabled = Boolean(project.editor?.snapEnabled ?? state.snapEnabled);
  state.zoom = clamp(Number(project.editor?.zoom) || state.zoom, getMinZoom(), 3);
  state.viewStartMs = Math.max(0, Number(project.editor?.viewStartMs) || 0);
  state.projectTimeMs = 0;
  state.projectEndMs = Math.max(getAudioEndMs(), getLastNoteTime() + 4000, getLastBpmTime() + 4000, 60000);
  state.selectedNoteIds = new Set();
  state.selectedBpmSegmentId = "";
  sortBpmSegments();
  state.notes.sort((a, b) => a.timeMs - b.timeMs);
  if (clearHistory) {
    state.history = [];
    state.future = [];
  }
  syncControls();
  renderAll();
}

function syncControls() {
  els.audioName.textContent = state.audioFileName || "未导入音频";
  els.divisionInput.value = getSegmentDivision(getSegmentAtTime(getCurrentTimeMs()));
  els.snapInput.checked = state.snapEnabled;
  els.zoomInput.value = state.zoom;
  els.audioDelayInput.value = formatMs(state.audioDelayMs);
  els.seekInput.max = getDurationMs();
  els.seekInput.value = getCurrentTimeMs();
  els.currentTimeInput.value = formatMs(getCurrentTimeMs());
  updateUndoRedoButtons();
}

function getCurrentTimeMs() {
  if (state.isPlaying) {
    if (state.audioStartedForTransport && els.audio.src && !els.audio.paused) {
      return clamp(state.audioDelayMs + els.audio.currentTime * 1000, 0, getDurationMs());
    }
    return clamp(state.transportStartProjectMs + (performance.now() - state.transportStartPerfMs) * (Number(els.playbackRateInput.value) || 1), 0, getDurationMs());
  }
  return state.projectTimeMs || 0;
}

function setCurrentTimeMs(timeMs) {
  const duration = getDurationMs();
  const next = clamp(Number(timeMs) || 0, 0, duration);
  state.projectTimeMs = next;
  state.transportStartProjectMs = next;
  state.transportStartPerfMs = performance.now();
  syncAudioToProjectTime(next, state.isPlaying, true);
  state.lastBeepTimeMs = next;
  state.beepedNoteIds = new Set();
  ensureTimeVisible(next);
  syncControls();
  draw();
}

function ensureTimeVisible(timeMs) {
  const viewDuration = getViewDurationMs();
  if (timeMs < state.viewStartMs) state.viewStartMs = Math.max(0, timeMs - viewDuration * 0.15);
  if (timeMs > state.viewStartMs + viewDuration) state.viewStartMs = Math.max(0, timeMs - viewDuration * 0.85);
}

function timeToX(timeMs) {
  return (timeMs - state.viewStartMs) * state.zoom;
}

function xToTime(x) {
  return state.viewStartMs + x / state.zoom;
}

function resizeCanvas() {
  const rect = els.canvas.getBoundingClientRect();
  const placerRect = els.placerCanvas.getBoundingClientRect();
  const overviewRect = els.overviewCanvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  els.canvas.width = Math.max(320, Math.floor(rect.width * scale));
  els.canvas.height = Math.max(320, Math.floor(rect.height * scale));
  els.placerCanvas.width = Math.max(320, Math.floor(placerRect.width * scale));
  els.placerCanvas.height = Math.max(120, Math.floor(placerRect.height * scale));
  els.overviewCanvas.width = Math.max(320, Math.floor(overviewRect.width * scale));
  els.overviewCanvas.height = Math.max(56, Math.floor(overviewRect.height * scale));
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  placerCtx.setTransform(scale, 0, 0, scale, 0, 0);
  overviewCtx.setTransform(scale, 0, 0, scale, 0, 0);
  draw();
}

function getCanvasSize() {
  const scale = window.devicePixelRatio || 1;
  return { width: els.canvas.width / scale, height: els.canvas.height / scale };
}

function getOverviewSize() {
  const scale = window.devicePixelRatio || 1;
  return { width: els.overviewCanvas.width / scale, height: els.overviewCanvas.height / scale };
}

function getPlacerSize() {
  const scale = window.devicePixelRatio || 1;
  return { width: els.placerCanvas.width / scale, height: els.placerCanvas.height / scale };
}

function draw() {
  const { width, height } = getCanvasSize();
  ctx.clearRect(0, 0, width, height);
  drawBackground(width, height);
  drawRuler(width);
  drawWaveform(width);
  drawPlayhead(height);
  drawPlacer();
  drawOverview();
  updateReadouts();
}

function drawOverview() {
  const { width, height } = getOverviewSize();
  const duration = getDurationMs();
  overviewCtx.clearRect(0, 0, width, height);

  const gradient = overviewCtx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#111925");
  gradient.addColorStop(1, "#080c12");
  overviewCtx.fillStyle = gradient;
  overviewCtx.fillRect(0, 0, width, height);

  drawOverviewWaveform(width, height, duration);
  drawOverviewNotes(width, height, duration);

  const viewDuration = getViewDurationMs();
  const boxX = (state.viewStartMs / duration) * width;
  const boxW = Math.max(12, Math.min(width, (viewDuration / duration) * width));
  const playX = (getCurrentTimeMs() / duration) * width;

  overviewCtx.fillStyle = "rgba(102, 227, 255, 0.12)";
  overviewCtx.fillRect(boxX, 5, boxW, height - 10);
  overviewCtx.strokeStyle = "rgba(102, 227, 255, 0.95)";
  overviewCtx.lineWidth = 2;
  overviewCtx.strokeRect(boxX, 5, boxW, height - 10);

  overviewCtx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  overviewCtx.beginPath();
  overviewCtx.moveTo(playX, 0);
  overviewCtx.lineTo(playX, height);
  overviewCtx.stroke();
}

function drawOverviewWaveform(width, height, duration) {
  const mid = height / 2;
  if (!state.waveform.length || !state.durationMs) {
    return;
  }
  const audioStartX = (state.audioDelayMs / duration) * width;
  const audioEndX = (getAudioEndMs() / duration) * width;
  overviewCtx.fillStyle = "rgba(102,227,255,0.12)";
  overviewCtx.fillRect(audioStartX, 0, audioEndX - audioStartX, height);
  overviewCtx.strokeStyle = "rgba(158,255,114,0.75)";
  overviewCtx.lineWidth = 1;
  overviewCtx.beginPath();
  for (let x = 0; x < width; x += 1) {
    const audioTimeMs = (x / width) * duration - state.audioDelayMs;
    if (audioTimeMs < 0 || audioTimeMs > state.durationMs) continue;
    const index = clamp(Math.floor((audioTimeMs / state.durationMs) * state.waveform.length), 0, state.waveform.length - 1);
    const amp = state.waveform[index] || 0;
    overviewCtx.moveTo(x, mid - amp * height * 0.36);
    overviewCtx.lineTo(x, mid + amp * height * 0.36);
  }
  overviewCtx.stroke();
}

function drawOverviewNotes(width, height, duration) {
  overviewCtx.fillStyle = "rgba(255,79,216,0.72)";
  for (const note of state.notes) {
    const x = (note.timeMs / duration) * width;
    overviewCtx.fillRect(x - 0.5, height - 17, 1, 12);
  }
}

function drawBackground(width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#0b1018");
  gradient.addColorStop(1, "#070a10");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.moveTo(0, height - 1);
  ctx.lineTo(width, height - 1);
  ctx.stroke();
}

function drawRuler(width) {
  const viewStart = state.viewStartMs;
  const viewEnd = state.viewStartMs + width / state.zoom;
  const targetPx = 90;
  const rawStep = targetPx / state.zoom;
  const step = niceStep(rawStep);
  const first = Math.floor(viewStart / step) * step;

  ctx.font = "normal 13px Arial, Helvetica, sans-serif";
  ctx.textBaseline = "top";
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.fillStyle = "rgba(237,242,255,0.65)";
  for (let t = first; t <= viewEnd; t += step) {
    const x = timeToX(t);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ROW.ruler);
    ctx.stroke();
    ctx.fillText(`${formatMs(t)}ms`, x + 4, 12);
  }
}

function niceStep(value) {
  const pow = 10 ** Math.floor(Math.log10(Math.max(1, value)));
  const normalized = value / pow;
  if (normalized <= 1) return pow;
  if (normalized <= 2) return 2 * pow;
  if (normalized <= 5) return 5 * pow;
  return 10 * pow;
}

function drawWaveform(width) {
  const top = ROW.waveformTop;
  const height = Math.max(24, getCanvasSize().height - top);
  const mid = top + height / 2;
  ctx.fillStyle = "rgba(102,227,255,0.06)";
  ctx.fillRect(0, top, width, height);

  if (!state.waveform.length || !state.durationMs) {
    return;
  }

  const audioStartX = timeToX(state.audioDelayMs);
  const audioEndX = timeToX(getAudioEndMs());
  ctx.fillStyle = "rgba(102,227,255,0.08)";
  ctx.fillRect(audioStartX, top, audioEndX - audioStartX, height);
  ctx.strokeStyle = "rgba(102,227,255,0.55)";
  ctx.strokeRect(audioStartX, top, audioEndX - audioStartX, height);

  ctx.strokeStyle = "rgba(102,227,255,0.82)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < width; x += 1) {
    const audioTimeMs = xToTime(x) - state.audioDelayMs;
    if (audioTimeMs < 0 || audioTimeMs > state.durationMs) continue;
    const index = clamp(Math.floor((audioTimeMs / state.durationMs) * state.waveform.length), 0, state.waveform.length - 1);
    const amp = state.waveform[index] || 0;
    ctx.moveTo(x, mid - amp * height * 0.45);
    ctx.lineTo(x, mid + amp * height * 0.45);
  }
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,209,102,0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(audioStartX, top - 2);
  ctx.lineTo(audioStartX, top + height + 2);
  ctx.stroke();
}

function drawPlacer() {
  const { width, height } = getPlacerSize();
  placerCtx.clearRect(0, 0, width, height);

  const gradient = placerCtx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#0e1520");
  gradient.addColorStop(1, "#070a10");
  placerCtx.fillStyle = gradient;
  placerCtx.fillRect(0, 0, width, height);

  drawPlacerGrid(width, height);
  drawBpmAxis(width);
  drawPlacerNotes(width, height);
  drawPlacerPlayhead(height);
}

function drawBpmAxis(width) {
  const viewStart = state.viewStartMs;
  const viewEnd = state.viewStartMs + width / state.zoom;
  sortBpmSegments();

  for (let i = 0; i < state.bpmSegments.length; i += 1) {
    const segment = state.bpmSegments[i];
    const segmentStart = segment.startMs;
    const segmentEnd = getSegmentEnd(i);
    if (segmentEnd < viewStart || segmentStart > viewEnd) continue;

    const x1 = clamp(timeToX(Math.max(segmentStart, viewStart)), 0, width);
    const x2 = clamp(timeToX(Math.min(segmentEnd, viewEnd)), 0, width);
    const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
    placerCtx.fillStyle = hexToRgba(color, 0.22);
    placerCtx.fillRect(x1, PLACER.bpmTop, Math.max(1, x2 - x1), PLACER.bpmHeight);
    placerCtx.strokeStyle = hexToRgba(color, 0.88);
    placerCtx.strokeRect(x1, PLACER.bpmTop, Math.max(1, x2 - x1), PLACER.bpmHeight);

    placerCtx.font = "12px ui-sans-serif, system-ui";
    const label = `${formatBpm(segment.bpm)} BPM`;
    const button = getBpmButtonRect(label, x1, x2);
    if (button) {
      placerCtx.fillStyle = "rgba(8,12,18,0.82)";
      drawRoundRect(placerCtx, button.x, button.y, button.width, button.height, 5);
      placerCtx.fill();
      placerCtx.strokeStyle = "rgba(237,242,255,0.42)";
      placerCtx.stroke();
      placerCtx.fillStyle = "rgba(237,242,255,0.95)";
      placerCtx.save();
      placerCtx.beginPath();
      placerCtx.rect(button.x + 6, button.y, button.width - 12, button.height);
      placerCtx.clip();
      placerCtx.textBaseline = "middle";
      placerCtx.fillText(fitText(placerCtx, label, button.width - 12), button.x + 6, button.y + button.height / 2);
      placerCtx.restore();
    }
  }

  for (let i = 1; i < state.bpmSegments.length; i += 1) {
    const segment = state.bpmSegments[i];
    const x = timeToX(segment.startMs);
    if (x < -4 || x > width + 4) continue;
    const selected = state.selectedBpmSegmentId === segment.id;
    placerCtx.strokeStyle = selected ? "rgba(255,79,216,1)" : "rgba(255,255,255,0.95)";
    placerCtx.lineWidth = selected ? 4 : 2;
    placerCtx.beginPath();
    placerCtx.moveTo(x, PLACER.bpmTop - 2);
    placerCtx.lineTo(x, PLACER.bpmTop + PLACER.bpmHeight + 2);
    placerCtx.stroke();

    if (selected) {
      placerCtx.fillStyle = "rgba(255,79,216,0.95)";
      placerCtx.beginPath();
      placerCtx.arc(x, PLACER.bpmTop + PLACER.bpmHeight / 2, 5, 0, Math.PI * 2);
      placerCtx.fill();
    }
  }
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getBpmButtonRect(label, x1, x2) {
  const maxWidth = x2 - x1 - 12;
  if (maxWidth < 42) return null;
  const idealWidth = placerCtx.measureText(label).width + 16;
  const width = clamp(idealWidth, 42, Math.min(96, maxWidth));
  return {
    x: x1 + 6,
    y: PLACER.bpmTop + Math.max(2, (PLACER.bpmHeight - 20) / 2),
    width,
    height: 20,
  };
}

function fitText(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) return text;
  let next = text;
  while (next.length > 1 && context.measureText(`${next}...`).width > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next}...`;
}

function drawRoundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function drawPlacerGrid(width, height) {
  const viewStart = state.viewStartMs;
  const viewEnd = state.viewStartMs + width / state.zoom;
  sortBpmSegments();

  for (let i = 0; i < state.bpmSegments.length; i += 1) {
    const segment = state.bpmSegments[i];
    const segmentStart = segment.startMs;
    const segmentEnd = getSegmentEnd(i);
    if (segmentEnd < viewStart || segmentStart > viewEnd) continue;
    const division = getSegmentDivision(segment);
    const gridMs = getGridMs(segment.bpm, division);
    const beatMs = 60000 / segment.bpm;
    const startIndex = Math.max(0, Math.floor((viewStart - segmentStart) / gridMs) - 1);
    const endIndex = Math.ceil((Math.min(viewEnd, segmentEnd) - segmentStart) / gridMs) + 1;

    for (let n = startIndex; n <= endIndex; n += 1) {
      const t = segmentStart + n * gridMs;
      if (t < viewStart - EPSILON || t > viewEnd + EPSILON || t > segmentEnd + EPSILON) continue;
      const x = timeToX(t);
      const beatAligned = Math.abs(((t - segmentStart) / beatMs) - Math.round((t - segmentStart) / beatMs)) < 0.0001;
      placerCtx.strokeStyle = beatAligned ? "rgba(158,255,114,0.55)" : "rgba(255,255,255,0.11)";
      placerCtx.lineWidth = beatAligned ? 1.4 : 1;
      placerCtx.beginPath();
      placerCtx.moveTo(x, PLACER.bpmTop);
      placerCtx.lineTo(x, height);
      placerCtx.stroke();
    }

    const sx = timeToX(segmentStart);
    if (sx >= -2 && sx <= width + 2) {
      placerCtx.strokeStyle = "rgba(255,209,102,0.9)";
      placerCtx.lineWidth = 2;
      placerCtx.beginPath();
      placerCtx.moveTo(sx, PLACER.laneTop);
      placerCtx.lineTo(sx, height);
      placerCtx.stroke();
    }
  }
}

function drawPlacerNotes(width, height) {
  const top = PLACER.laneTop + 14;
  const bottom = height - 8;
  const viewEnd = state.viewStartMs + width / state.zoom;

  for (const note of state.notes) {
    if (note.timeMs < state.viewStartMs - 20 || note.timeMs > viewEnd + 20) continue;
    const x = timeToX(note.timeMs);
    const selected = state.selectedNoteIds.has(note.id);
    placerCtx.strokeStyle = selected ? "#ffffff" : "rgba(255,79,216,0.95)";
    placerCtx.fillStyle = selected ? "rgba(255,255,255,0.95)" : "rgba(255,79,216,0.88)";
    placerCtx.lineWidth = selected ? 3 : 2;
    placerCtx.beginPath();
    placerCtx.moveTo(x, top);
    placerCtx.lineTo(x, bottom);
    placerCtx.stroke();
    placerCtx.beginPath();
    placerCtx.arc(x, top - 6, selected ? 5 : 4, 0, Math.PI * 2);
    placerCtx.fill();
  }
}

function drawPlacerPlayhead(height) {
  const x = timeToX(getCurrentTimeMs());
  placerCtx.strokeStyle = "rgba(102,227,255,0.96)";
  placerCtx.lineWidth = 2;
  placerCtx.beginPath();
  placerCtx.moveTo(x, 0);
  placerCtx.lineTo(x, height);
  placerCtx.stroke();
}

function drawPlayhead(height) {
  const x = timeToX(getCurrentTimeMs());
  ctx.strokeStyle = "rgba(102,227,255,0.96)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();
}

function updateReadouts() {
  const current = getCurrentTimeMs();
  const duration = getDurationMs();
  els.timeReadout.textContent = `${formatMs(current)} / ${formatMs(duration)} ms`;
  els.selectionReadout.textContent = state.selectedNoteIds.size
    ? `已选中 ${state.selectedNoteIds.size} 个音符`
    : state.selectedBpmSegmentId
      ? "已选中 BPM 分界线"
    : "未选中音符";
  const segment = getSegmentAtTime(current);
  const division = getSegmentDivision(segment);
  els.gridReadout.textContent = `BPM ${formatBpm(segment.bpm)}, 1/${division}, grid ${formatMs(getGridMs(segment.bpm, division))}ms`;
}

function renderAll() {
  renderTxtPreview();
  renderIssues(state.lastIssues);
  syncControls();
  draw();
  saveAutosaveCache();
}

function saveAutosaveCache() {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...serializeProject(true), cachedAt: Date.now() }));
  } catch (error) {
    console.warn("Failed to save autosave cache", error);
  }
}

function loadAutosaveCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const project = JSON.parse(raw);
    applyProject(project, true);
    if (project.audioFileName && !els.audio.src) {
      els.audioName.textContent = `${project.audioFileName}（需重新导入音频）`;
    }
    return true;
  } catch (error) {
    console.warn("Failed to load autosave cache", error);
    return false;
  }
}

function renderTxtPreview() {
  sortBpmSegments();
  els.bpmList.innerHTML = "";
  const rows = getTxtRows(false);
  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "hint";
    empty.textContent = "暂无内容。添加 BPM 段或音符后显示最终 txt 预览。";
    els.bpmList.appendChild(empty);
    return;
  }

  rows.forEach((row, index) => {
    const card = document.createElement("div");
    card.className = `rowCard compact ${row.kind === "bpm" ? "bpmPreview" : "notePreview"}`;
    card.innerHTML = `
      <div class="rowTop"><span>#${index + 1}</span><span>${row.kind === "bpm" ? "timegroup" : "note"}</span></div>
      <code class="previewLine">${row.text}</code>
    `;
    els.bpmList.appendChild(card);
  });
}

function getTxtRows(applySnap) {
  const rows = [];
  for (const segment of state.bpmSegments) {
    rows.push({ kind: "bpm", timeMs: segment.startMs, text: `timegroup ${formatMs(segment.startMs)} ${formatBpm(segment.bpm)}` });
  }

  const noteTimes = [];
  for (const note of state.notes) {
    const timeMs = applySnap ? snapTimeToGrid(note.timeMs) : note.timeMs;
    if (!noteTimes.some((time) => Math.abs(time - timeMs) <= EPSILON)) noteTimes.push(timeMs);
  }
  for (const timeMs of noteTimes) rows.push({ kind: "note", timeMs, text: formatMs(timeMs) });

  rows.sort((a, b) => {
    if (Math.abs(a.timeMs - b.timeMs) > EPSILON) return a.timeMs - b.timeMs;
    if (a.kind === b.kind) return 0;
    return a.kind === "bpm" ? -1 : 1;
  });
  return rows;
}

function renderIssues(issues) {
  state.lastIssues = issues;
  els.issuesList.classList.toggle("hasIssues", issues.length > 0);
  els.issuesList.textContent = issues.length ? issues.map((issue) => `${issue.level}: ${issue.message}`).join("\n") : "暂无问题";
}

function addNoteAt(timeMs, source = "grid") {
  pushHistory();
  const note = { id: createId(), timeMs: maybeSnap(timeMs), source };
  state.notes.push(note);
  state.notes.sort((a, b) => a.timeMs - b.timeMs);
  state.selectedNoteIds = new Set([note.id]);
  state.selectedBpmSegmentId = "";
  renderAll();
}

function deleteSelectedNotes() {
  if (!state.selectedNoteIds.size && !state.selectedBpmSegmentId) return;
  pushHistory();
  if (state.selectedNoteIds.size) {
    state.notes = state.notes.filter((note) => !state.selectedNoteIds.has(note.id));
  }
  if (state.selectedBpmSegmentId) {
    state.bpmSegments = state.bpmSegments.filter((segment, index) => index === 0 || segment.id !== state.selectedBpmSegmentId);
    sortBpmSegments();
  }
  state.selectedNoteIds.clear();
  state.selectedBpmSegmentId = "";
  renderAll();
}

function copySelectedNotes() {
  const selected = state.notes
    .filter((note) => state.selectedNoteIds.has(note.id))
    .sort((a, b) => a.timeMs - b.timeMs);
  if (!selected.length) return;
  const baseTime = selected[0].timeMs;
  state.clipboard = selected.map((note) => ({ offsetMs: note.timeMs - baseTime, source: note.source }));
}

function pasteNotesAtCurrentTime() {
  if (!state.clipboard.length) return;
  pushHistory();
  const baseTime = maybeSnap(getCurrentTimeMs());
  const pasted = state.clipboard.map((item) => ({
    id: createId(),
    timeMs: maybeSnap(baseTime + item.offsetMs),
    source: item.source || "manual",
  }));
  state.notes.push(...pasted);
  state.notes.sort((a, b) => a.timeMs - b.timeMs);
  state.selectedNoteIds = new Set(pasted.map((note) => note.id));
  state.selectedBpmSegmentId = "";
  renderAll();
}

function moveSelectedNotes(deltaMs) {
  if (!state.selectedNoteIds.size && !state.selectedBpmSegmentId) return false;
  pushHistory();
  for (const note of state.notes) {
    if (state.selectedNoteIds.has(note.id)) note.timeMs = maybeSnap(note.timeMs + deltaMs);
  }
  if (state.selectedBpmSegmentId) {
    const segment = state.bpmSegments.find((item) => item.id === state.selectedBpmSegmentId);
    if (segment) {
      const sorted = [...state.bpmSegments].sort((a, b) => a.startMs - b.startMs);
      const index = sorted.findIndex((item) => item.id === segment.id);
      const min = (sorted[index - 1]?.startMs ?? 0) + EPSILON;
      const max = (sorted[index + 1]?.startMs ?? getDurationMs()) - EPSILON;
      segment.startMs = clamp(snapTimeToGrid(segment.startMs + deltaMs), min, max);
      sortBpmSegments();
    }
  }
  state.notes.sort((a, b) => a.timeMs - b.timeMs);
  renderAll();
  return true;
}

function hitTestNote(x, y) {
  if (y < PLACER.laneTop - 10) return null;
  let closest = null;
  let distance = Infinity;
  for (const note of state.notes) {
    const noteX = timeToX(note.timeMs);
    const d = Math.abs(noteX - x);
    if (d < 9 && d < distance) {
      closest = note;
      distance = d;
    }
  }
  return closest;
}

function hitTestBpmBoundary(x, y) {
  if (y < PLACER.bpmTop - 10 || y > PLACER.bpmTop + PLACER.bpmHeight + 12) return null;
  sortBpmSegments();
  let closest = null;
  let distance = Infinity;
  const hitRadius = 16;
  for (let i = 0; i < state.bpmSegments.length; i += 1) {
    const segment = state.bpmSegments[i];
    if (segment.startMs <= EPSILON) continue;
    const bx = timeToX(segment.startMs);
    const d = Math.abs(bx - x);
    if (d <= hitRadius && d < distance) {
      closest = { segment, index: i };
      distance = d;
    }
  }
  return closest;
}

function hitTestBpmButton(x, y) {
  const viewStart = state.viewStartMs;
  const viewEnd = state.viewStartMs + getPlacerSize().width / state.zoom;
  placerCtx.font = "12px ui-sans-serif, system-ui";
  for (let i = 0; i < state.bpmSegments.length; i += 1) {
    const segment = state.bpmSegments[i];
    const x1 = clamp(timeToX(Math.max(segment.startMs, viewStart)), 0, getPlacerSize().width);
    const x2 = clamp(timeToX(Math.min(getSegmentEnd(i), viewEnd)), 0, getPlacerSize().width);
    const button = getBpmButtonRect(`${formatBpm(segment.bpm)} BPM`, x1, x2);
    if (button && x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) return segment;
  }
  return null;
}

function getCanvasPoint(event) {
  const rect = els.canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function hitTestAudioRegion(x, y) {
  if (!state.waveform.length || !state.durationMs) return false;
  const startX = timeToX(state.audioDelayMs);
  return Math.abs(x - startX) <= 8 && y >= ROW.waveformTop - 8 && y <= ROW.waveformTop + ROW.waveformHeight + 8;
}

function getPlacerPoint(event) {
  const rect = els.placerCanvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function setScrubTimeMs(timeMs) {
  setCurrentTimeMs(snapTimeToGrid(timeMs));
}

function promptBpmValue(defaultBpm) {
  const input = window.prompt("输入 BPM", formatBpm(defaultBpm));
  if (input === null) return null;
  const bpm = Number(input);
  return Number.isFinite(bpm) && bpm > 0 ? bpm : null;
}

function onCanvasPointerDown(event) {
  const point = getCanvasPoint(event);
  if (hitTestAudioRegion(point.x, point.y)) {
    state.dragging = {
      kind: "audio",
      source: "canvas",
      startX: point.x,
      beforeSnapshot: JSON.stringify(serializeProject(false)),
      originalDelayMs: state.audioDelayMs,
      changed: false,
    };
    return;
  }
  setScrubTimeMs(xToTime(point.x));
  state.dragging = { kind: "scrub", source: "canvas" };
}

function onPlacerPointerDown(event) {
  const point = getPlacerPoint(event);
  if (point.y >= PLACER.laneTop) {
    const note = hitTestNote(point.x, point.y);
    if (note) {
      if (event.shiftKey) {
        if (state.selectedNoteIds.has(note.id)) state.selectedNoteIds.delete(note.id);
        else state.selectedNoteIds.add(note.id);
      } else if (!state.selectedNoteIds.has(note.id)) {
        state.selectedNoteIds = new Set([note.id]);
      }
      state.selectedBpmSegmentId = "";
      state.dragging = {
        kind: "note",
        source: "placer",
        startX: point.x,
        beforeSnapshot: JSON.stringify(serializeProject(false)),
        original: state.notes.map((item) => ({ id: item.id, timeMs: item.timeMs })),
        changed: false,
      };
      renderAll();
      return;
    }

    addNoteAt(xToTime(point.x), "grid");
    return;
  }

  const bpmBoundary = hitTestBpmBoundary(point.x, point.y);
  if (bpmBoundary) {
    state.selectedBpmSegmentId = bpmBoundary.segment.id;
    state.selectedNoteIds.clear();
    state.dragging = {
      kind: "bpm",
      source: "placer",
      startX: point.x,
      beforeSnapshot: JSON.stringify(serializeProject(false)),
      segmentId: bpmBoundary.segment.id,
      originalStartMs: bpmBoundary.segment.startMs,
      changed: false,
    };
    renderAll();
    return;
  }

  const bpmButton = hitTestBpmButton(point.x, point.y);
  if (bpmButton) {
    const bpm = promptBpmValue(bpmButton.bpm);
    if (bpm !== null) {
      pushHistory();
      bpmButton.bpm = bpm;
      state.selectedBpmSegmentId = bpmButton.id;
      state.selectedNoteIds.clear();
      renderAll();
    }
    return;
  }

  if (point.y >= PLACER.bpmTop && point.y <= PLACER.bpmTop + PLACER.bpmHeight) {
    const timeMs = snapTimeToGrid(xToTime(point.x));
    const current = getSegmentAtTime(timeMs);
    pushHistory();
    const segment = { id: createId(), startMs: timeMs, bpm: current.bpm, division: getSegmentDivision(current), label: "" };
    state.bpmSegments.push(segment);
    state.selectedBpmSegmentId = segment.id;
    state.selectedNoteIds.clear();
    sortBpmSegments();
    renderAll();
    return;
  }
}

function onCanvasPointerMove(event) {
  if (!state.dragging) return;
  const point = state.dragging.source === "placer" ? getPlacerPoint(event) : getCanvasPoint(event);
  if (state.dragging.kind === "pan") {
    const deltaMs = (state.dragging.startX - point.x) / state.zoom;
    state.viewStartMs = clamp(state.dragging.startViewStartMs + deltaMs, 0, getDurationMs());
    draw();
    return;
  }

  if (state.dragging.kind === "scrub") {
    setScrubTimeMs(xToTime(point.x));
    return;
  }

  if (state.dragging.kind === "note") {
    const deltaMs = (point.x - state.dragging.startX) / state.zoom;
    for (const original of state.dragging.original) {
      if (!state.selectedNoteIds.has(original.id)) continue;
      const note = state.notes.find((item) => item.id === original.id);
      if (note) note.timeMs = maybeSnap(original.timeMs + deltaMs);
    }
    state.dragging.changed = true;
    state.notes.sort((a, b) => a.timeMs - b.timeMs);
    renderTxtPreview();
    draw();
    return;
  }

  if (state.dragging.kind === "bpm") {
    const deltaMs = (point.x - state.dragging.startX) / state.zoom;
    const segment = state.bpmSegments.find((item) => item.id === state.dragging.segmentId);
    if (segment) {
      const sorted = [...state.bpmSegments].sort((a, b) => a.startMs - b.startMs);
      const index = sorted.findIndex((item) => item.id === segment.id);
      const min = (sorted[index - 1]?.startMs ?? 0) + EPSILON;
      const max = (sorted[index + 1]?.startMs ?? getDurationMs()) - EPSILON;
      segment.startMs = clamp(snapTimeToGrid(state.dragging.originalStartMs + deltaMs), min, max);
      state.dragging.changed = true;
      sortBpmSegments();
      draw();
      renderTxtPreview();
    }
  }

  if (state.dragging.kind === "audio") {
    const deltaMs = (point.x - state.dragging.startX) / state.zoom;
    state.audioDelayMs = Math.max(0, state.dragging.originalDelayMs + deltaMs);
    state.dragging.changed = true;
    setProjectEndAtLeast(getAudioEndMs());
    syncAudioToProjectTime(getCurrentTimeMs(), state.isPlaying, true);
    draw();
    syncControls();
  }
}

function onCanvasPointerUp() {
  if (state.dragging?.kind === "note" && state.dragging.changed) {
    state.history.push(state.dragging.beforeSnapshot);
    if (state.history.length > 100) state.history.shift();
    state.future = [];
    renderAll();
  }
  if (state.dragging?.kind === "bpm" && state.dragging.changed) {
    state.history.push(state.dragging.beforeSnapshot);
    if (state.history.length > 100) state.history.shift();
    state.future = [];
    renderAll();
  }
  if (state.dragging?.kind === "audio" && state.dragging.changed) {
    state.history.push(state.dragging.beforeSnapshot);
    if (state.history.length > 100) state.history.shift();
    state.future = [];
    renderAll();
  }
  state.dragging = null;
}

function onCanvasWheel(event) {
  const point = getCanvasPoint(event);
  const before = xToTime(point.x);

  if (event.ctrlKey || event.metaKey) {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 0.88;
    state.zoom = clamp(state.zoom * factor, getMinZoom(), 3);
    els.zoomInput.value = state.zoom;
    state.viewStartMs = Math.max(0, before - point.x / state.zoom);
    draw();
    return;
  }

  const horizontalDelta = event.shiftKey
    ? (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY)
    : event.deltaX;
  if (Math.abs(horizontalDelta) > 0) {
    event.preventDefault();
    state.viewStartMs = clamp(state.viewStartMs + horizontalDelta / state.zoom, 0, Math.max(0, getDurationMs() - getViewDurationMs()));
    draw();
  }
}

function getOverviewPoint(event) {
  const rect = els.overviewCanvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function getOverviewViewBox() {
  const { width, height } = getOverviewSize();
  const duration = getDurationMs();
  const viewDuration = getViewDurationMs();
  return {
    x: (state.viewStartMs / duration) * width,
    y: 5,
    width: Math.max(12, Math.min(width, (viewDuration / duration) * width)),
    height: height - 10,
  };
}

function setViewWindow(startMs, viewDurationMs) {
  const duration = getDurationMs();
  const timelineWidth = getCanvasSize().width;
  const nextViewDuration = clamp(viewDurationMs, Math.max(250, timelineWidth / 3), duration);
  state.zoom = clamp(timelineWidth / nextViewDuration, getMinZoom(), 3);
  state.viewStartMs = clamp(startMs, 0, Math.max(0, duration - getViewDurationMs()));
  els.zoomInput.value = state.zoom;
  draw();
}

function fitWholeSong() {
  state.zoom = getFitWholeZoom();
  state.viewStartMs = 0;
  els.zoomInput.value = state.zoom;
  draw();
}

function onOverviewPointerDown(event) {
  const point = getOverviewPoint(event);
  const box = getOverviewViewBox();
  const duration = getDurationMs();
  const overviewWidth = getOverviewSize().width;
  const inBox = point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;

  if (!inBox) {
    const timeMs = clamp((point.x / overviewWidth) * duration, 0, duration);
    setCurrentTimeMs(timeMs);
    setViewWindow(timeMs - getViewDurationMs() / 2, getViewDurationMs());
  }

  state.overviewDrag = {
    startX: point.x,
    startY: point.y,
    originalStartMs: state.viewStartMs,
    originalViewDurationMs: getViewDurationMs(),
  };
}

function onOverviewPointerMove(event) {
  if (!state.overviewDrag) return;
  const point = getOverviewPoint(event);
  const duration = getDurationMs();
  const overviewWidth = getOverviewSize().width;
  const deltaTime = ((point.x - state.overviewDrag.startX) / overviewWidth) * duration;
  const scale = 2 ** ((state.overviewDrag.startY - point.y) / 180);
  const nextViewDuration = state.overviewDrag.originalViewDurationMs * scale;
  const originalCenter = state.overviewDrag.originalStartMs + state.overviewDrag.originalViewDurationMs / 2;
  const nextCenter = originalCenter + deltaTime;
  setViewWindow(nextCenter - nextViewDuration / 2, nextViewDuration);
}

function onOverviewPointerUp() {
  state.overviewDrag = null;
}

async function loadAudio(file) {
  if (!file) return;
  if (state.audioObjectUrl) URL.revokeObjectURL(state.audioObjectUrl);
  state.audioObjectUrl = URL.createObjectURL(file);
  els.audio.src = state.audioObjectUrl;
  state.audioFileName = file.name;
  els.audioName.textContent = file.name;

  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  state.durationMs = decoded.duration * 1000;
  state.audioDelayMs = 0;
  state.projectEndMs = getAudioEndMs();
  state.projectTimeMs = 0;
  els.audio.currentTime = 0;
  state.waveform = buildWaveform(decoded, 6000);
  await audioContext.close();
  syncControls();
  renderAll();
}

function buildWaveform(buffer, samples) {
  const channel = buffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(channel.length / samples));
  const waveform = [];
  for (let i = 0; i < samples; i += 1) {
    let sum = 0;
    const start = i * blockSize;
    const end = Math.min(channel.length, start + blockSize);
    for (let j = start; j < end; j += 1) sum += Math.abs(channel[j]);
    waveform.push(Math.min(1, sum / Math.max(1, end - start) * 2.8));
  }
  return waveform;
}

function playPause() {
  if (!state.isPlaying) {
    prepareBeepPlayback();
    startTransport();
  }
  else pauseTransport();
}

function startTransport() {
  state.isPlaying = true;
  state.transportStartProjectMs = state.projectTimeMs || 0;
  state.transportStartPerfMs = performance.now();
  state.audioStartedForTransport = false;
  syncAudioToProjectTime(state.transportStartProjectMs, true, true);
  els.playBtn.textContent = "暂停";
}

function pauseTransport() {
  state.projectTimeMs = getCurrentTimeMs();
  state.isPlaying = false;
  els.audio.pause();
  state.audioStartedForTransport = false;
  els.playBtn.textContent = "播放";
  syncControls();
  draw();
}

function syncAudioToProjectTime(projectTimeMs, shouldPlay, forceSeek = false) {
  if (!els.audio.src || !state.durationMs) return;
  const audioTimeMs = projectTimeMs - state.audioDelayMs;
  const inAudio = audioTimeMs >= 0 && audioTimeMs <= state.durationMs;
  if (!inAudio) {
    if (!els.audio.paused) els.audio.pause();
    if (audioTimeMs < 0) {
      state.audioStartedForTransport = false;
      if (forceSeek) els.audio.currentTime = 0;
    }
    return;
  }

  const targetSeconds = audioTimeMs / 1000;
  if (forceSeek || !state.audioStartedForTransport) els.audio.currentTime = targetSeconds;
  if (shouldPlay && !state.audioStartedForTransport) {
    els.audio.playbackRate = Number(els.playbackRateInput.value) || 1;
    els.audio.play();
    state.audioStartedForTransport = true;
  }
}

function updateTransportAnchor(projectTimeMs) {
  state.transportStartProjectMs = projectTimeMs;
  state.transportStartPerfMs = performance.now();
}

function getBeepContext() {
  if (!state.beepContext) state.beepContext = new (window.AudioContext || window.webkitAudioContext)();
  return state.beepContext;
}

function prepareBeepPlayback() {
  const context = getBeepContext();
  if (context.state === "suspended") context.resume();
  state.lastBeepTimeMs = getCurrentTimeMs();
  state.beepedNoteIds = new Set();
}

function playBeep() {
  const context = getBeepContext();
  const now = context.currentTime;
  const pitch = clamp(Number(els.pluckPitchInput.value) || 1760, 800, 3200);
  const volume = clamp(Number(els.pluckVolumeInput.value) || 0, 0, 1);
  if (volume <= 0) return;
  const osc = context.createOscillator();
  const overtone = context.createOscillator();
  const gain = context.createGain();
  const overtoneGain = context.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(pitch, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, pitch * 0.75), now + 0.045);

  overtone.type = "sine";
  overtone.frequency.setValueAtTime(pitch * 2, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  overtoneGain.gain.setValueAtTime(0.0001, now);
  overtoneGain.gain.exponentialRampToValueAtTime(volume * 0.3, now + 0.002);
  overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

  osc.connect(gain).connect(context.destination);
  overtone.connect(overtoneGain).connect(context.destination);
  osc.start(now);
  overtone.start(now);
  osc.stop(now + 0.1);
  overtone.stop(now + 0.04);
}

function triggerDueBeeps() {
  const current = getCurrentTimeMs();
  const previous = state.lastBeepTimeMs || current;
  const start = Math.min(previous, current) - 2;
  const end = Math.max(previous, current) + 8;

  for (const note of state.notes) {
    if (state.beepedNoteIds.has(note.id)) continue;
    if (note.timeMs >= start && note.timeMs <= end) {
      playBeep();
      state.beepedNoteIds.add(note.id);
    }
  }
  state.lastBeepTimeMs = current;
}

function validateProject() {
  const issues = [];
  const duration = getDurationMs();
  const sortedSegments = [...state.bpmSegments].sort((a, b) => a.startMs - b.startMs);

  sortedSegments.forEach((segment, index) => {
    if (!Number.isFinite(segment.startMs) || segment.startMs < 0) {
      issues.push({ level: "error", message: `BPM 段 #${index + 1} 时间无效` });
    }
    if (!Number.isFinite(segment.bpm) || segment.bpm <= 0) {
      issues.push({ level: "error", message: `BPM 段 #${index + 1} BPM 必须大于 0` });
    }
    if (!Number.isFinite(segment.division) || segment.division < 1) {
      issues.push({ level: "error", message: `BPM 段 #${index + 1} 分音必须大于等于 1` });
    }
    if (index > 0 && Math.abs(segment.startMs - sortedSegments[index - 1].startMs) <= EPSILON) {
      issues.push({ level: "error", message: `BPM 段 #${index + 1} 与上一段时间重复` });
    }
  });

  const sortedNotes = [...state.notes].sort((a, b) => a.timeMs - b.timeMs);
  sortedNotes.forEach((note, index) => {
    if (!Number.isFinite(note.timeMs) || note.timeMs < 0 || note.timeMs > duration + EPSILON) {
      issues.push({ level: "error", message: `音符 #${index + 1} 超出音频范围` });
    }
    if (index > 0 && Math.abs(note.timeMs - sortedNotes[index - 1].timeMs) <= EPSILON) {
      issues.push({ level: "warn", message: `音符 #${index + 1} 与上一音符重复` });
    }
    const snapped = snapTimeToGrid(note.timeMs);
    if (Math.abs(snapped - note.timeMs) > EPSILON) {
      issues.push({ level: "warn", message: `音符 #${index + 1} 未对齐栅格，偏差 ${formatMs(note.timeMs - snapped)}ms` });
    }
  });

  renderIssues(issues);
  return issues;
}

function exportTxt() {
  const issues = validateProject();
  if (issues.some((issue) => issue.level === "error")) {
    const proceed = window.confirm("存在错误级校验问题，仍要导出吗？");
    if (!proceed) return;
  }

  const rows = getTxtRows(state.snapEnabled);

  downloadText(rows.map((row) => row.text).join("\n") + "\n", getBaseName(state.audioFileName || "chart") + ".txt", "text/plain");
}

function importTxt(text) {
  const bpmSegments = [];
  const notes = [];
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    if (parts[0] === "timegroup") {
      const startMs = Number(parts[1]);
      const bpm = Number(parts[2]);
      if (Number.isFinite(startMs) && Number.isFinite(bpm) && bpm > 0) {
        bpmSegments.push({ id: createId(), startMs, bpm, division: state.division, label: "" });
      }
    } else {
      const timeMs = Number(parts[0]);
      if (Number.isFinite(timeMs)) notes.push({ id: createId(), timeMs, source: "manual" });
    }
  }

  pushHistory();
  if (bpmSegments.length) state.bpmSegments = bpmSegments;
  state.notes = notes;
  state.selectedNoteIds.clear();
  sortBpmSegments();
  state.notes.sort((a, b) => a.timeMs - b.timeMs);
  setProjectEndAtLeast(Math.max(getLastNoteTime() + 4000, getLastBpmTime() + 4000));
  renderAll();
}

function downloadText(text, filename, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getBaseName(filename) {
  return filename.replace(/\.[^.]+$/, "") || "chart";
}

function addBpmAtCurrentTime() {
  const timeMs = getCurrentTimeMs();
  const segment = getSegmentAtTime(timeMs);
  pushHistory();
  const nextSegment = { id: createId(), startMs: timeMs, bpm: segment.bpm, division: getSegmentDivision(segment), label: "" };
  state.bpmSegments.push(nextSegment);
  state.selectedBpmSegmentId = nextSegment.id;
  state.selectedNoteIds.clear();
  sortBpmSegments();
  renderAll();
}

function getCurrentGridStepMs() {
  const segment = getSegmentAtTime(getCurrentTimeMs());
  return getGridMs(segment.bpm, getSegmentDivision(segment));
}

function moveCursorByGrid(direction) {
  const step = getCurrentGridStepMs();
  setCurrentTimeMs(getCurrentTimeMs() + direction * step);
}

function restartPlayback() {
  setCurrentTimeMs(0);
  startTransport();
}

function clearNotes() {
  if (!state.notes.length) return;
  const ok = window.confirm("确定清空所有音符吗？");
  if (!ok) return;
  pushHistory();
  state.notes = [];
  state.selectedNoteIds.clear();
  state.selectedBpmSegmentId = "";
  renderAll();
}

function bindEvents() {
  els.audioInput.addEventListener("change", (event) => loadAudio(event.target.files[0]));
  els.txtInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) importTxt(await file.text());
    event.target.value = "";
  });
  els.projectInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) applyProject(JSON.parse(await file.text()));
    event.target.value = "";
  });

  els.playBtn.addEventListener("click", playPause);
  els.restartBtn.addEventListener("click", restartPlayback);
  els.cursorLeftBtn.addEventListener("click", () => moveCursorByGrid(-1));
  els.cursorRightBtn.addEventListener("click", () => moveCursorByGrid(1));
  els.audio.addEventListener("play", () => { if (state.isPlaying) els.playBtn.textContent = "暂停"; });
  els.audio.addEventListener("pause", () => { if (!state.isPlaying) els.playBtn.textContent = "播放"; });
  els.audio.addEventListener("loadedmetadata", () => {
    state.durationMs = els.audio.duration * 1000 || state.durationMs;
    syncControls();
    draw();
  });
  els.audio.addEventListener("timeupdate", () => {
    syncControls();
    draw();
  });

  els.currentTimeInput.addEventListener("change", (event) => setCurrentTimeMs(event.target.value));
  els.audioDelayInput.addEventListener("change", (event) => {
    pushHistory();
    state.audioDelayMs = Math.max(0, Number(event.target.value) || 0);
    setProjectEndAtLeast(getAudioEndMs());
    syncAudioToProjectTime(getCurrentTimeMs(), state.isPlaying, true);
    renderAll();
  });
  els.seekInput.addEventListener("input", (event) => setCurrentTimeMs(event.target.value));
  els.playbackRateInput.addEventListener("change", (event) => { els.audio.playbackRate = Number(event.target.value) || 1; });
  els.divisionInput.addEventListener("change", (event) => {
    pushHistory();
    const segment = getSegmentAtTime(getCurrentTimeMs());
    const division = Math.max(1, Math.floor(Number(event.target.value) || 4));
    segment.division = division;
    state.division = division;
    event.target.value = division;
    renderAll();
  });
  els.zoomInput.addEventListener("input", (event) => {
    state.zoom = clamp(Number(event.target.value) || 0.35, getMinZoom(), 3);
    state.viewStartMs = clamp(state.viewStartMs, 0, Math.max(0, getDurationMs() - getViewDurationMs()));
    draw();
  });
  els.snapInput.addEventListener("change", (event) => { state.snapEnabled = event.target.checked; });

  els.tapBtn.addEventListener("click", () => addNoteAt(getCurrentTimeMs(), "tap"));
  els.addBpmBtn.addEventListener("click", addBpmAtCurrentTime);
  els.extendProjectBtn.addEventListener("click", () => {
    state.projectEndMs = getDurationMs() + 10000;
    syncControls();
    draw();
  });
  els.fitSongBtn.addEventListener("click", fitWholeSong);
  els.undoBtn.addEventListener("click", undo);
  els.redoBtn.addEventListener("click", redo);
  els.deleteSelectedBtn.addEventListener("click", deleteSelectedNotes);
  els.validateBtn.addEventListener("click", validateProject);
  els.exportBtn.addEventListener("click", exportTxt);
  els.saveProjectBtn.addEventListener("click", () => {
    downloadText(JSON.stringify(serializeProject(), null, 2), getBaseName(state.audioFileName || "dlchart") + ".json", "application/json");
  });
  els.normalizeBpmBtn.addEventListener("click", () => { pushHistory(); sortBpmSegments(); renderAll(); });
  els.clearNotesBtn.addEventListener("click", clearNotes);

  els.canvas.addEventListener("pointerdown", onCanvasPointerDown);
  els.placerCanvas.addEventListener("pointerdown", onPlacerPointerDown);
  els.overviewCanvas.addEventListener("pointerdown", onOverviewPointerDown);
  window.addEventListener("pointermove", onCanvasPointerMove);
  window.addEventListener("pointermove", onOverviewPointerMove);
  window.addEventListener("pointerup", onCanvasPointerUp);
  window.addEventListener("pointerup", onOverviewPointerUp);
  els.canvas.addEventListener("wheel", onCanvasWheel, { passive: false });
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("keydown", onKeyDown);
}

function onKeyDown(event) {
  if (["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
  if (event.code === "Space") {
    event.preventDefault();
    playPause();
  } else if (event.key.toLowerCase() === "t") {
    addNoteAt(getCurrentTimeMs(), "tap");
  } else if (event.key.toLowerCase() === "r") {
    restartPlayback();
  } else if (event.key === "Delete" || event.key === "Backspace") {
    deleteSelectedNotes();
  } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    undo();
  } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
    event.preventDefault();
    redo();
  } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c") {
    event.preventDefault();
    copySelectedNotes();
  } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "v") {
    event.preventDefault();
    pasteNotesAtCurrentTime();
  } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    const step = event.altKey ? 1 : getCurrentGridStepMs();
    if (event.shiftKey) moveSelectedNotes(direction * step);
    else setCurrentTimeMs(getCurrentTimeMs() + direction * step);
  }
}

function animationLoop() {
  if (state.isPlaying) {
    const current = getCurrentTimeMs();
    state.projectTimeMs = current;
    if (current >= getDurationMs() - EPSILON) {
      pauseTransport();
      setCurrentTimeMs(getDurationMs());
    } else {
      const wasAudioStarted = state.audioStartedForTransport;
      syncAudioToProjectTime(current, true, false);
      if (!wasAudioStarted && state.audioStartedForTransport) updateTransportAnchor(getCurrentTimeMs());
    }
    triggerDueBeeps();
    syncControls();
    draw();
  }
  requestAnimationFrame(animationLoop);
}

bindEvents();
resizeCanvas();
syncControls();
if (!loadAutosaveCache()) renderAll();
animationLoop();
