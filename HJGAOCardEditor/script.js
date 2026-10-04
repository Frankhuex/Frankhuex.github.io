const SAMPLE_JSON_PATH = "./poker.json";
const UNCATEGORIZED = "";
const typeLabel = type => type === UNCATEGORIZED ? "未分类" : type;
const STORAGE_KEY = "hjgao-card-editor-session";
const DEFAULT_DESIGN_REQUIREMENT =
  "请生成一套标准扑克牌卡组，共 54 张。普通牌牌名使用“♠️A”“♥️10”这种“花色 emoji + 点数”的格式；四种花色顺序固定为黑桃、红心、梅花、方块，并且同一点数排在一起，例如：♠️A♥️A♣️A♦️A、♠️2♥️2♣️2♦️2，依此类推。最后两张分别命名为“小王🃏”和“大王🤡”。";

const state = {
  cards: [],
  dragIndex: null,
  typeOrder: [],
  selected: new Set(),
  collapsed: new Set(),
  dragType: null,
  statusKind: "neutral",
  statusMessage: "欢迎使用卡组编辑器。可以先从空白卡组开始，也可以导入已有 JSON。",
  includeCurrentJsonInPrompt: false,
  toastTimer: null,
  promptPersistTimer: null,
};

const elements = {
  uniqueCardCount: document.getElementById("unique-card-count"),
  totalCardCount: document.getElementById("total-card-count"),
  validationSummary: document.getElementById("validation-summary"),
  statusBanner: document.getElementById("status-banner"),
  validationBadge: document.getElementById("validation-badge"),
  validationList: document.getElementById("validation-list"),
  emptyState: document.getElementById("empty-state"),
  cardList: document.getElementById("card-list"),
  jsonPreview: document.getElementById("json-preview"),
  promptOutput: document.getElementById("prompt-output"),
  promptExtraInput: document.getElementById("prompt-extra-input"),
  includeCurrentJson: document.getElementById("include-current-json"),
  downloadFilenameInput: document.getElementById("download-filename-input"),
  toast: document.getElementById("toast"),
  pasteJsonModal: document.getElementById("paste-json-modal"),
  pasteJsonInput: document.getElementById("paste-json-input"),
  pasteJsonError: document.getElementById("paste-json-error"),
  pasteJsonButton: document.getElementById("paste-json-button"),
  closePasteJsonButton: document.getElementById("close-paste-json-button"),
  clearPasteJsonButton: document.getElementById("clear-paste-json-button"),
  cancelPasteJsonButton: document.getElementById("cancel-paste-json-button"),
  confirmPasteJsonButton: document.getElementById("confirm-paste-json-button"),
  copyJsonButton: document.getElementById("copy-json-button"),
  copyPromptButton: document.getElementById("copy-prompt-button"),
  copyExtraInputButton: document.getElementById("copy-extra-input-button"),
  fileInput: document.getElementById("file-input"),
  cardTemplate: document.getElementById("card-item-template"),
  insertTemplate: document.getElementById("insert-button-template"),
  newDeckButton: document.getElementById("new-deck-button"),
  importButton: document.getElementById("import-button"),
  loadSampleButton: document.getElementById("load-sample-button"),
  downloadButton: document.getElementById("download-button"),
};

function getPromptBaseText() {
  return [
    "你需要为我生成一个卡组 JSON。",
    "请严格遵守以下要求：",
    "1. 输出必须是合法 JSON。",
    "2. 不要输出 Markdown 代码块，不要输出解释，不要输出额外说明，只输出 JSON 本体。",
    '3. JSON 顶层必须是一个对象，并且只包含一个字段：`deck_template`。',
    "4. `deck_template` 必须是对象，并且只包含一个字段：`ordered_card_templates`。",
    "5. `ordered_card_templates` 必须是数组，数组中的每一项都必须是对象。",
    "6. 每个卡牌对象只能包含以下字段，其中 name、count、description 必填，type 可选：",
    '   - `type`: 非空字符串，按卡牌在游玩时的可混合性划分；没有分类时直接省略 type 字段，不要输出空字符串；显式命名为“未分类”的类型属于普通类型，应保留该字符串。',
    '   - `name`: 字符串，表示牌名。',
    '   - `count`: 整数，表示这张牌的数量，必须大于等于 0。',
    '   - `description`: 字符串，表示这张牌的描述。',
    "7. `type` 决定卡牌在游玩时能否混合：相同 type 的卡牌可以混合使用，不同 type 的卡牌不可混合使用。请按游戏规则中实际的混合范围划分 type，例如哪些牌可以混在同一个牌堆中洗牌、抽取或发放。",
    "   - 典型示例：武将牌、游戏牌、血量牌、身份牌在游玩时需要分别使用、不可混合，因此应分别填写 type：武将牌、游戏牌、血量牌、身份牌。",
    "   - 游戏牌内部的锦囊牌、基本牌、装备牌可以混合使用，因此这些牌的 type 必须统一填写“游戏牌”，不能分别填写“锦囊牌”“基本牌”“装备牌”。这些功能子分类如需保留，可写入 description。",
    "   - 不要仅因卡牌的功能、效果、名称、花色或其他属性不同就拆分 type。生成前检查：可以混合使用的牌是否使用了完全相同的 type 字符串；不可混合使用的牌是否已使用不同的 type。",
    "8. 按类型分组排列，同类型卡牌连续出现；类型顺序和类内顺序就是最终顺序。",
    "9. 如果我提供了现有 JSON，则说明你需要在保留整体结构合法的前提下基于现有内容修改，不要改成别的格式。",
    "10. 返回结果示例格式如下：",
    "{",
    '  "deck_template": {',
    '    "ordered_card_templates": [',
    "      {",
    '        "name": "示例卡牌",',
    '        "count": 1,',
    '        "description": "示例描述"',
    "      }",
    "    ]",
    "  }",
    "}",
  ].join("\n");
}

function buildPromptText() {
  const sections = [getPromptBaseText()];
  const currentJson = elements.jsonPreview.value.trim();
  const extra = elements.promptExtraInput.value.trim();

  if (state.includeCurrentJsonInPrompt) {
    sections.push(
      [
        "这是现有的 JSON，你需要基于此做修改，并继续保持输出结构完全符合要求：",
        currentJson,
      ].join("\n")
    );
  }

  sections.push("以下是待生成JSON的卡牌设计：");
  sections.push(extra || DEFAULT_DESIGN_REQUIREMENT);

  return sections.join("\n\n");
}

function showToast(kind, message) {
  if (state.toastTimer) {
    window.clearTimeout(state.toastTimer);
  }

  elements.toast.textContent = message;
  elements.toast.className = `toast is-visible is-${kind}`;
  elements.toast.setAttribute("aria-hidden", "false");

  state.toastTimer = window.setTimeout(() => {
    elements.toast.className = "toast";
    elements.toast.setAttribute("aria-hidden", "true");
    state.toastTimer = null;
  }, 2600);
}

function openPasteJsonModal() {
  elements.pasteJsonError.textContent = "";
  elements.pasteJsonModal.hidden = false;
  elements.pasteJsonModal.classList.add("is-visible");
  elements.pasteJsonModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    elements.pasteJsonInput.focus();
  }, 0);
}

function closePasteJsonModal() {
  elements.pasteJsonError.textContent = "";
  elements.pasteJsonModal.classList.remove("is-visible");
  elements.pasteJsonModal.setAttribute("aria-hidden", "true");
  elements.pasteJsonModal.hidden = true;
}

function parseCardsFromJson(json) {
  const orderedCardTemplates =
    json?.deck_template?.ordered_card_templates ?? json?.ordered_card_templates;

  if (!Array.isArray(orderedCardTemplates)) {
    throw new Error("缺少合法的 ordered_card_templates 数组。");
  }

  return orderedCardTemplates.map((card, index) => {
    if (!card || typeof card !== "object" || Array.isArray(card)) {
      throw new Error(`第 ${index + 1} 项不是合法的卡牌对象。`);
    }

    const name = escapeJsonText(card.name);
    const count = normalizeCount(card.count);

    if (!name) {
      throw new Error(`第 ${index + 1} 项的 name 不能为空。`);
    }

    if (!Number.isInteger(count) || count < 0) {
      throw new Error(`第 ${index + 1} 项的 count 必须是大于等于 0 的整数。`);
    }

    if (card.type != null && typeof card.type !== "string") {
      throw new Error(`第 ${index + 1} 项的 type 必须是字符串。`);
    }
    return createCard(name, count, String(card.description ?? ""), card.type);
  });
}

function importCards(cards, sourceLabel) {
  state.cards = groupCards(cards);
  state.typeOrder = [...new Set(state.cards.map(card => card.type))];
  state.selected.clear();
  state.collapsed.clear();
  setStatus("success", `已导入 ${sourceLabel}，共 ${cards.length} 种牌。`);
  render();
}

function submitPastedJson() {
  const raw = elements.pasteJsonInput.value.trim();
  elements.pasteJsonError.textContent = "";

  if (!raw) {
    elements.pasteJsonError.textContent = "请先粘贴 JSON 内容。";
    return;
  }

  try {
    const json = JSON.parse(raw);
    const cards = parseCardsFromJson(json);
    importCards(cards, "粘贴的 JSON");
    closePasteJsonModal();
    elements.pasteJsonInput.value = "";
  } catch (error) {
    elements.pasteJsonError.textContent = `导入失败：${error.message}`;
  }
}

async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("success", successMessage);
  } catch (error) {
    const fallbackTextarea = document.createElement("textarea");
    fallbackTextarea.value = text;
    fallbackTextarea.setAttribute("readonly", "true");
    fallbackTextarea.style.position = "fixed";
    fallbackTextarea.style.opacity = "0";
    fallbackTextarea.style.pointerEvents = "none";
    document.body.appendChild(fallbackTextarea);
    fallbackTextarea.focus();
    fallbackTextarea.select();

    let copied = false;

    try {
      copied = document.execCommand("copy");
    } catch (fallbackError) {
      copied = false;
    }

    fallbackTextarea.remove();

    if (copied) {
      showToast("success", successMessage);
    } else {
      showToast("error", `复制失败：${error.message}`);
    }
  }
}

function createCard(name = "", count = 1, description = "", type = UNCATEGORIZED) {
  return {
    id: `card-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name,
    count,
    description,
    type: normalizeType(type),
  };
}

function normalizeDownloadFilename(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "deck";
  }

  return trimmed.toLowerCase().endsWith(".json") ? trimmed.slice(0, -5) || "deck" : trimmed;
}

function persistEditorState() {
  const payload = {
    version: 2,
    typeOrder: state.typeOrder,
    cards: state.cards.map((card) => ({
      id: typeof card.id === "string" ? card.id : createCard().id,
      name: String(card.name ?? ""),
      count: card.count ?? 1,
      description: String(card.description ?? ""),
      type: normalizeType(card.type),
    })),
    promptExtraInput: elements.promptExtraInput.value,
    includeCurrentJsonInPrompt: state.includeCurrentJsonInPrompt,
    downloadFilename: normalizeDownloadFilename(elements.downloadFilenameInput.value),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    setStatus("error", `自动保存失败：${error.message}`);
    renderStatus();
  }
}

function schedulePersistEditorState(delay = 0) {
  if (state.promptPersistTimer) {
    window.clearTimeout(state.promptPersistTimer);
    state.promptPersistTimer = null;
  }

  if (delay <= 0) {
    persistEditorState();
    return;
  }

  state.promptPersistTimer = window.setTimeout(() => {
    persistEditorState();
    state.promptPersistTimer = null;
  }, delay);
}

function restoreEditorState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw);
    const restoreType = value => parsed.version !== 2 && normalizeType(value) === "未分类" ? UNCATEGORIZED : normalizeType(value);
    const cards = Array.isArray(parsed?.cards)
      ? parsed.cards.map((card) => ({
          id: typeof card?.id === "string" ? card.id : createCard().id,
          name: String(card?.name ?? ""),
          count: card?.count ?? 1,
          description: String(card?.description ?? ""),
          type: restoreType(card?.type),
        }))
      : [];

    state.cards = groupCards(cards);
    state.typeOrder = [...new Set(state.cards.map(card => card.type))];
    state.selected.clear();
    state.collapsed.clear();
    state.typeOrder = [...new Set([...(Array.isArray(parsed.typeOrder) ? parsed.typeOrder.map(restoreType) : []), ...state.typeOrder])];
    syncTypeOrder();
    state.includeCurrentJsonInPrompt = Boolean(parsed?.includeCurrentJsonInPrompt);
    elements.includeCurrentJson.checked = state.includeCurrentJsonInPrompt;
    elements.promptExtraInput.value = String(parsed?.promptExtraInput ?? "");
    elements.downloadFilenameInput.value = normalizeDownloadFilename(parsed?.downloadFilename ?? "deck");
    setStatus("success", "已恢复上次未完成的编辑内容。");
    render();
    return true;
  } catch (error) {
    setStatus("error", `恢复本地缓存失败：${error.message}`);
    renderStatus();
    return false;
  }
}

function createEmptyDeck() {
  state.cards = [];
  state.typeOrder = [];
  state.selected.clear();
  state.collapsed.clear();
  setStatus("neutral", "已新建空白卡组。点击中间的加号开始编辑。");
  render();
}

function setStatus(kind, message) {
  state.statusKind = kind;
  state.statusMessage = message;
}

function escapeJsonText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCount(value) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : NaN;
}

function validateCards(cards) {
  const errors = [];
  const seenNames = new Map();

  cards.forEach((card, index) => {
    const displayIndex = index + 1;
    const trimmedName = escapeJsonText(card.name);
    const count = normalizeCount(card.count);

    if (!trimmedName) {
      errors.push(`第 ${displayIndex} 张牌的牌名不能为空。`);
    }

    if (trimmedName) {
      if (seenNames.has(trimmedName)) {
        const firstIndex = seenNames.get(trimmedName) + 1;
        errors.push(`第 ${displayIndex} 张牌与第 ${firstIndex} 张牌重名：${trimmedName}。`);
      } else {
        seenNames.set(trimmedName, index);
      }
    }

    if (!Number.isInteger(count) || count < 0) {
      errors.push(`第 ${displayIndex} 张牌的数量必须是大于等于 0 的整数。`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    duplicateNames: new Set(
      errors
        .filter((error) => error.includes("重名"))
        .map((error) => error.split("：").pop().replace("。", ""))
    ),
  };
}

function buildDeckJson(cards) {
  const validation = validateCards(cards);

  if (!validation.valid) {
    return { validation, json: null };
  }

  const orderedCardTemplates = groupCards(cards).map((card) => ({
    ...(normalizeType(card.type) === UNCATEGORIZED ? {} : { type: normalizeType(card.type) }),
    name: escapeJsonText(card.name),
    count: normalizeCount(card.count),
    description: String(card.description ?? ""),
  }));

  return {
    validation,
    json: {
      deck_template: {
        ordered_card_templates: orderedCardTemplates,
      },
    },
  };
}

function getCardErrorState(validation) {
  const invalidNameIndexes = new Set();
  const invalidCountIndexes = new Set();
  const seenNames = new Map();

  state.cards.forEach((card, index) => {
    const trimmedName = escapeJsonText(card.name);
    const count = normalizeCount(card.count);

    if (!trimmedName) {
      invalidNameIndexes.add(index);
    }

    if (trimmedName) {
      if (seenNames.has(trimmedName)) {
        invalidNameIndexes.add(index);
        invalidNameIndexes.add(seenNames.get(trimmedName));
      } else {
        seenNames.set(trimmedName, index);
      }
    }

    if (!Number.isInteger(count) || count < 0) {
      invalidCountIndexes.add(index);
    }
  });

  return { invalidNameIndexes, invalidCountIndexes, validation };
}

function renderStatus() {
  elements.statusBanner.textContent = state.statusMessage;
  elements.statusBanner.className = "status-banner";

  if (state.statusKind === "error") {
    elements.statusBanner.classList.add("is-error");
  }

  if (state.statusKind === "success") {
    elements.statusBanner.classList.add("is-success");
  }
}

function renderValidation(validation) {
  elements.validationList.innerHTML = "";

  if (validation.valid) {
    const info = document.createElement("li");
    info.textContent = "结构校验通过，可以直接下载。";
    elements.validationList.appendChild(info);
    elements.validationBadge.textContent = "已通过";
    elements.validationBadge.className = "validation-badge validation-ok";
    elements.validationSummary.textContent = "可导出";
    return;
  }

  validation.errors.forEach((error) => {
    const item = document.createElement("li");
    item.textContent = error;
    elements.validationList.appendChild(item);
  });

  elements.validationBadge.textContent = `存在 ${validation.errors.length} 个问题`;
  elements.validationBadge.className = "validation-badge validation-error";
  elements.validationSummary.textContent = "需修复";
}

function renderMetrics() {
  elements.uniqueCardCount.textContent = String(state.cards.length);
  elements.totalCardCount.textContent = String(
    state.cards.reduce((sum, card) => {
      const count = normalizeCount(card.count);
      return sum + (Number.isInteger(count) && count >= 0 ? count : 0);
    }, 0)
  );
}

function renderPreview(json) {
  if (json) {
    elements.jsonPreview.value = JSON.stringify(json, null, 2);
    return;
  }

  elements.jsonPreview.value = JSON.stringify(
    {
      deck_template: {
        ordered_card_templates: [],
      },
    },
    null,
    2
  );
}

function resizeDescriptionTextarea(textarea) {
  const maxHeight = 132;
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
}

function updateCardErrorStyles(validation) {
  const { invalidNameIndexes, invalidCountIndexes } = getCardErrorState(validation);

  elements.cardList.querySelectorAll(".card-row").forEach((row) => {
    const index = Number(row.dataset.index);
    const hasError = invalidNameIndexes.has(index) || invalidCountIndexes.has(index);
    row.classList.toggle("has-error", hasError);
  });
}

function renderDerivedState() {
  const deck = buildDeckJson(state.cards);
  renderStatus();
  renderMetrics();
  renderValidation(deck.validation);
  renderPreview(deck.json);
  renderPrompt();
  updateCardErrorStyles(deck.validation);
  schedulePersistEditorState();
}

function renderPrompt() {
  elements.promptOutput.value = buildPromptText();
}

function normalizeType(type) {
  return typeof type === "string" && type.trim() ? type.trim() : UNCATEGORIZED;
}

// Map preserves first occurrence order, including special names such as __proto__.
function groupCards(cards) {
  const groups = new Map();
  cards.forEach((card) => {
    card.type = normalizeType(card.type);
    if (!groups.has(card.type)) groups.set(card.type, []);
    groups.get(card.type).push(card);
  });
  return [...groups.values()].flat();
}

function types() { return state.typeOrder; }

function syncTypeOrder() {
  state.cards.forEach(card => {
    card.type = normalizeType(card.type);
    if (!state.typeOrder.includes(card.type)) state.typeOrder.push(card.type);
  });
  if (!state.typeOrder.includes(UNCATEGORIZED)) state.typeOrder.push(UNCATEGORIZED);
  state.cards = state.typeOrder.flatMap(type => state.cards.filter(card => card.type === type));
}

function moveType(type, target) {
  const order = [...types()];
  const from = order.indexOf(type);
  if (from < 0 || target < 0 || target >= order.length) return;
  order.splice(from, 1);
  order.splice(target, 0, type);
  state.typeOrder = order;
  state.cards = order.flatMap(name => state.cards.filter(card => card.type === name));
  render();
}

function moveCard(card, delta) {
  const index = state.cards.indexOf(card);
  const next = state.cards[index + delta];
  if (!next || next.type !== card.type) return;
  state.cards.splice(index, 1);
  state.cards.splice(index + delta, 0, card);
  render();
}

function updateSelection() {
  const ids = new Set(state.cards.map(card => card.id));
  state.selected.forEach(id => { if (!ids.has(id)) state.selected.delete(id); });
  document.getElementById("selection-count").textContent = `已选 ${state.selected.size} 张卡牌`;
  document.getElementById("change-type-button").disabled = !state.selected.size;
  const all = document.getElementById("select-all");
  all.checked = !!state.cards.length && state.selected.size === state.cards.length;
  all.indeterminate = state.selected.size > 0 && !all.checked;
  all.disabled = !state.cards.length;
  elements.cardList.querySelectorAll(".card-row").forEach(row => {
    const selected = state.selected.has(row.dataset.cardId);
    row.classList.toggle("is-selected", selected);
    row.querySelector(".card-select").checked = selected;
  });
  elements.cardList.querySelectorAll(".type-select").forEach(box => {
    const cards = state.cards.filter(card => card.type === box.dataset.type);
    const count = cards.filter(card => state.selected.has(card.id)).length;
    box.checked = cards.length > 0 && count === cards.length;
    box.disabled = cards.length === 0;
    box.indeterminate = count > 0 && count < cards.length;
  });
}

function actionButton(text, label, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "group-action";
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.addEventListener("click", action);
  return button;
}

function renderCards() {
  elements.cardList.replaceChildren();
  elements.emptyState.classList.toggle("is-visible", !state.typeOrder.length);
  if (!state.typeOrder.length) appendInsertSlot(0, elements.cardList, UNCATEGORIZED);
  types().forEach((type, typeIndex, order) => {
    const label = typeLabel(type);
    const accessibleLabel = type === UNCATEGORIZED ? "未分类（默认分组）" : type;
    const cards = state.cards.filter(card => card.type === type);
    const section = document.createElement("section");
    section.className = "type-group";
    const header = document.createElement("div");
    header.className = "type-header";
    const select = document.createElement("input");
    select.type = "checkbox";
    select.className = "type-select";
    select.dataset.type = type;
    select.setAttribute("aria-label", `选择 ${accessibleLabel} 的全部卡牌`);
    select.addEventListener("change", () => {
      cards.forEach(card => select.checked ? state.selected.add(card.id) : state.selected.delete(card.id));
      updateSelection();
    });
    const body = document.createElement("div");
    body.id = `type-body-${typeIndex}`;
    body.hidden = state.collapsed.has(type);
    const toggle = actionButton(`${body.hidden ? "▸" : "▾"} ${label}`, `展开或折叠 ${accessibleLabel}`, () => {
      if (state.collapsed.has(type)) state.collapsed.delete(type); else state.collapsed.add(type);
      body.hidden = state.collapsed.has(type);
      toggle.textContent = `${body.hidden ? "▸" : "▾"} ${label}`;
      toggle.setAttribute("aria-expanded", String(!body.hidden));
      if (!body.hidden) body.querySelectorAll("textarea").forEach(resizeDescriptionTextarea);
    });
    toggle.classList.add("type-toggle");
    toggle.classList.toggle("is-uncategorized", type === UNCATEGORIZED);
    toggle.setAttribute("aria-expanded", String(!body.hidden));
    toggle.setAttribute("aria-controls", body.id);
    const badge = document.createElement("span");
    badge.className = "type-count";
    badge.textContent = `${cards.length} 种`;
    const drag = actionButton("⠿", `拖动类型 ${accessibleLabel} 排序`, () => {});
    drag.draggable = true;
    drag.addEventListener("dragstart", event => {
      state.dragType = type;
      event.dataTransfer.setData("text/plain", type);
      event.dataTransfer.effectAllowed = "move";
    });
    drag.addEventListener("dragend", () => { state.dragType = null; cleanupDropTargets(); });
    header.addEventListener("dragover", event => {
      if (state.dragType === null || state.dragType === type) return;
      event.preventDefault(); cleanupDropTargets(); header.classList.add("is-drop-target");
    });
    header.addEventListener("drop", event => {
      if (state.dragType === null) return;
      event.preventDefault();
      const source = state.dragType; state.dragType = null;
      moveType(source, typeIndex);
    });
    const up = actionButton("↑", `上移类型 ${accessibleLabel}`, () => moveType(type, typeIndex - 1));
    const down = actionButton("↓", `下移类型 ${accessibleLabel}`, () => moveType(type, typeIndex + 1));
    up.disabled = typeIndex === 0; down.disabled = typeIndex === order.length - 1;
    header.append(drag, select, toggle, badge);
    if (type !== UNCATEGORIZED) {
      header.append(actionButton("改名", `改名类型 ${type}`, () => openTypeDialog("rename", type)));
    }
    header.append(up, down);
    section.append(header, body);
    elements.cardList.append(section);
    const startIndex = state.cards.filter(card => state.typeOrder.indexOf(card.type) < typeIndex).length;
    appendInsertSlot(startIndex, body, type);
    cards.forEach((card, localIndex) => {
      const index = state.cards.indexOf(card);
      const fragment = elements.cardTemplate.content.cloneNode(true);
      const row = fragment.querySelector(".card-row");
      row.dataset.cardId = card.id;
      row.dataset.index = index;
      fragment.querySelector(".row-index").textContent = `#${localIndex + 1}`;
      const checkbox = fragment.querySelector(".card-select");
      checkbox.setAttribute("aria-label", `选择卡牌 ${card.name || localIndex + 1}`);
      checkbox.addEventListener("change", () => {
        checkbox.checked ? state.selected.add(card.id) : state.selected.delete(card.id);
        updateSelection();
      });
      ["name", "count", "description"].forEach(field => {
        const input = fragment.querySelector(`.${field}-input`);
        input.value = card[field];
        input.addEventListener("input", () => {
          card[field] = input.value;
          if (field === "description") resizeDescriptionTextarea(input);
          renderDerivedState();
        });
      });
      fragment.querySelector(".delete-button").addEventListener("click", () => {
        state.cards = state.cards.filter(item => item.id !== card.id); render();
      });
      const controls = fragment.querySelector(".row-order");
      const up = actionButton("↑", "上移卡牌", () => moveCard(card, -1));
      const down = actionButton("↓", "下移卡牌", () => moveCard(card, 1));
      up.disabled = localIndex === 0; down.disabled = localIndex === cards.length - 1;
      controls.append(up, down);
      const handle = fragment.querySelector(".drag-handle");
      handle.draggable = true;
      handle.addEventListener("dragstart", event => {
        state.dragIndex = index;
        event.dataTransfer.setData("text/plain", card.id);
        event.dataTransfer.effectAllowed = "move";
        row.classList.add("is-dragging");
      });
      handle.addEventListener("dragend", () => {
        state.dragIndex = null; row.classList.remove("is-dragging"); cleanupDropTargets();
      });
      row.addEventListener("dragover", event => {
        if (state.dragIndex === null || state.cards[state.dragIndex]?.type !== type) return;
        event.preventDefault(); cleanupDropTargets(); row.classList.add("is-drop-target");
      });
      row.addEventListener("drop", event => {
        if (state.dragIndex === null || state.cards[state.dragIndex]?.type !== type) return;
        event.preventDefault();
        const [moved] = state.cards.splice(state.dragIndex, 1);
        state.cards.splice(index, 0, moved);
        state.dragIndex = null; render();
      });
      body.append(fragment);
      resizeDescriptionTextarea(row.querySelector("textarea"));
      appendInsertSlot(index + 1, body, type);
    });
  });
  updateSelection();
}

function appendInsertSlot(index, parent, type) {
  const fragment = elements.insertTemplate.content.cloneNode(true);
  fragment.querySelector("button").addEventListener("click", () => addCardAt(index, type));
  parent.append(fragment);
}

function switchSelectedType(type) {
  type = normalizeType(type);
  if (!state.typeOrder.includes(type)) state.typeOrder.push(type);
  const moved = state.cards.filter(card => state.selected.has(card.id) && card.type !== type);
  // Keep existing target cards in place; append incoming cards in visible order.
  const remaining = state.cards.filter(card => !moved.includes(card));
  moved.forEach(card => { card.type = type; });
  state.cards = groupCards([...remaining, ...moved]);
  state.selected.clear();
  state.collapsed.delete(type);
  setStatus("success", `已将 ${moved.length} 张卡牌移至“${typeLabel(type)}”。`);
  render();
}

function renameType(source, name) {
  const target = name.trim();
  if (source === UNCATEGORIZED) throw new Error("默认未分类分组无法改名。");
  if (!state.typeOrder.includes(source)) throw new Error("要改名的类型已不存在。");
  if (!target) throw new Error("请输入类型名称。");
  if (target !== source && state.typeOrder.includes(target)) throw new Error("该类型已存在，请使用其他名称；如需合并，请多选卡牌后切换类型。");
  state.typeOrder = state.typeOrder.map(type => type === source ? target : type);
  state.cards.forEach(card => { if (card.type === source) card.type = target; });
  if (state.collapsed.delete(source)) state.collapsed.add(target);
  setStatus("success", `类型“${source}”已改名为“${target}”。`);
  render();
}

let typeDialogMode = "move";
let typeRenameSource = null;

function openTypeDialog(mode = "move", source = null) {
  typeDialogMode = mode;
  typeRenameSource = source;
  document.getElementById("type-dialog-error").textContent = "";
  const dialog = document.getElementById("type-dialog");
  const choices = document.getElementById("type-choices");
  choices.replaceChildren();
  [...new Set([...types(), UNCATEGORIZED])].forEach(type => {
    if (type === UNCATEGORIZED) return;
    const option = document.createElement("option"); option.value = type; choices.append(option);
  });
  document.getElementById("type-target").value = mode === "rename" ? source : "";
  document.getElementById("type-dialog-title").textContent = mode === "rename" ? "类型改名" : mode === "create" ? "新建类型" : "切换卡牌类型";
  document.getElementById("type-dialog-count").textContent = mode === "rename" ? "修改类型名称，该类型内的所有卡牌将同步更新，顺序保持不变。" : mode === "create" ? "输入类型名称，创建后可在类型内添加卡牌。" : `为选中的 ${state.selected.size} 张卡牌选择已有类型，或输入新类型。`;
  document.getElementById("type-dialog-hint").textContent = mode === "rename" ? "名称不能为空或与已有类型重名；可以使用“未分类”作为普通类型名。" : "留空归入灰色的默认未分类分组，导出时省略 type；输入“未分类”会使用同名普通类型。移入卡牌追加到目标类型末尾，新类型排在最后，空类型保留。";
  dialog.showModal();
  document.getElementById("type-target").focus();
}

function cleanupDropTargets() {
  elements.cardList.querySelectorAll(".is-drop-target").forEach((node) => {
    node.classList.remove("is-drop-target");
  });
}

function render() {
  syncTypeOrder();
  renderCards();
  renderDerivedState();
}

function addCardAt(index, type = UNCATEGORIZED) {
  state.cards.splice(index, 0, createCard("", 1, "", type));
  setStatus("success", `已在第 ${index + 1} 个位置插入一张牌。`);
  render();
}

function loadCardsFromJson(json, sourceLabel) {
  try {
    const cards = parseCardsFromJson(json);
    importCards(cards, sourceLabel);
  } catch (error) {
    setStatus("error", `导入失败：${error.message}`);
    render();
  }
}

async function loadSampleJson() {
  try {
    const response = await fetch(SAMPLE_JSON_PATH, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`读取示例失败，状态码：${response.status}`);
    }

    const json = await response.json();
    loadCardsFromJson(json, "当前目录的 poker.json");
  } catch (error) {
    setStatus("error", `加载示例失败：${error.message}`);
    render();
  }
}

function handleFileImport(file) {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const json = JSON.parse(String(reader.result));
      loadCardsFromJson(json, `文件 ${file.name}`);
    } catch (error) {
      setStatus("error", `文件解析失败：${error.message}`);
      render();
    }
  };

  reader.onerror = () => {
    setStatus("error", `读取文件失败：${file.name}`);
    render();
  };

  reader.readAsText(file, "utf-8");
}

function downloadJson() {
  const deck = buildDeckJson(state.cards);

  if (!deck.validation.valid) {
    setStatus("error", "当前数据存在校验错误，修复后才能下载。");
    render();
    return;
  }

  const blob = new Blob([`${JSON.stringify(deck.json, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${normalizeDownloadFilename(elements.downloadFilenameInput.value)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  setStatus("success", "已生成并下载 JSON 文件。");
  render();
}

function bindEvents() {
  document.getElementById("select-all").addEventListener("change", event => {
    state.selected = event.target.checked ? new Set(state.cards.map(card => card.id)) : new Set();
    updateSelection();
  });
  document.getElementById("change-type-button").addEventListener("click", () => openTypeDialog());
  document.getElementById("create-type-button").addEventListener("click", () => openTypeDialog("create"));
  document.getElementById("cancel-type").addEventListener("click", () => document.getElementById("type-dialog").close());
  document.getElementById("type-form").addEventListener("submit", event => {
    event.preventDefault();
    const type = normalizeType(document.getElementById("type-target").value);
    if (typeDialogMode === "rename") {
      try {
        renameType(typeRenameSource, document.getElementById("type-target").value);
      } catch (error) {
        document.getElementById("type-dialog-error").textContent = error.message;
        return;
      }
    } else if (typeDialogMode === "create") {
      if (!state.typeOrder.includes(type)) state.typeOrder.push(type);
      state.collapsed.delete(type);
      render();
    } else switchSelectedType(type);
    document.getElementById("type-dialog").close();
  });
  elements.newDeckButton.addEventListener("click", createEmptyDeck);
  elements.importButton.addEventListener("click", () => elements.fileInput.click());
  elements.pasteJsonButton.addEventListener("click", openPasteJsonModal);
  elements.loadSampleButton.addEventListener("click", loadSampleJson);
  elements.downloadButton.addEventListener("click", downloadJson);
  elements.closePasteJsonButton.addEventListener("click", closePasteJsonModal);
  elements.clearPasteJsonButton.addEventListener("click", () => {
    elements.pasteJsonInput.value = "";
    elements.pasteJsonError.textContent = "";
    elements.pasteJsonInput.focus();
  });
  elements.cancelPasteJsonButton.addEventListener("click", closePasteJsonModal);
  elements.confirmPasteJsonButton.addEventListener("click", submitPastedJson);
  elements.copyJsonButton.addEventListener("click", () => {
    copyText(elements.jsonPreview.value, "已复制当前 JSON。");
  });
  elements.copyPromptButton.addEventListener("click", () => {
    copyText(elements.promptOutput.value, "已复制提示词。");
  });
  elements.copyExtraInputButton.addEventListener("click", () => {
    copyText(elements.promptExtraInput.value, "已复制设计要求。");
  });
  elements.promptExtraInput.addEventListener("input", () => {
    renderPrompt();
    schedulePersistEditorState(5000);
  });
  elements.promptExtraInput.addEventListener("blur", () => {
    schedulePersistEditorState();
  });
  elements.downloadFilenameInput.addEventListener("input", () => {
    elements.downloadFilenameInput.value = normalizeDownloadFilename(elements.downloadFilenameInput.value);
    schedulePersistEditorState(300);
  });
  elements.downloadFilenameInput.addEventListener("blur", () => {
    elements.downloadFilenameInput.value = normalizeDownloadFilename(elements.downloadFilenameInput.value);
    schedulePersistEditorState();
  });
  elements.includeCurrentJson.addEventListener("change", (event) => {
    state.includeCurrentJsonInPrompt = event.target.checked;
    renderPrompt();
    schedulePersistEditorState();
  });
  elements.pasteJsonModal.addEventListener("click", (event) => {
    if (event.target === elements.pasteJsonModal) {
      closePasteJsonModal();
    }
  });
  elements.pasteJsonInput.addEventListener("input", () => {
    if (elements.pasteJsonError.textContent) {
      elements.pasteJsonError.textContent = "";
    }
  });
  elements.pasteJsonInput.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      submitPastedJson();
    }
  });

  elements.fileInput.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    handleFileImport(file);
    event.target.value = "";
  });
}

function initializeApp() {
  if (!restoreEditorState()) {
    createEmptyDeck();
  }
}

window.addEventListener("beforeunload", () => {
  schedulePersistEditorState();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && elements.pasteJsonModal.classList.contains("is-visible")) {
    closePasteJsonModal();
  }
});

bindEvents();
initializeApp();
