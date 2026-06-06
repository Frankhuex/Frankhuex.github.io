const SAMPLE_JSON_PATH = "./poker.json";
const STORAGE_KEY = "hjgao-card-editor-session";
const DEFAULT_DESIGN_REQUIREMENT =
  "请生成一套标准扑克牌卡组，共 54 张。普通牌牌名使用“♠️A”“♥️10”这种“花色 emoji + 点数”的格式；四种花色顺序固定为黑桃、红心、梅花、方块，并且同一点数排在一起，例如：♠️A♥️A♣️A♦️A、♠️2♥️2♣️2♦️2，依此类推。最后两张分别命名为“小王🃏”和“大王🤡”。";

const state = {
  cards: [],
  dragIndex: null,
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
    '3. JSON 顶层必须是一个对象，并且只包含一个字段：`ordered_card_templates`。',
    "4. `ordered_card_templates` 必须是数组，数组中的每一项都必须是对象。",
    "5. 每个卡牌对象必须且只能包含以下字段：",
    '   - `name`: 字符串，表示牌名。',
    '   - `count`: 整数，表示这张牌的数量，必须大于等于 0。',
    '   - `description`: 字符串，表示这张牌的描述。',
    "6. 数组顺序就是卡牌的最终顺序，请按设计要求直接给出正确顺序。",
    "7. 如果我提供了现有 JSON，则说明你需要在保留整体结构合法的前提下基于现有内容修改，而不是改成别的格式。",
    "8. 返回结果示例格式如下：",
    "{",
    '  "ordered_card_templates": [',
    "    {",
    '      "name": "示例卡牌",',
    '      "count": 1,',
    '      "description": "示例描述"',
    "    }",
    "  ]",
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

function createCard(name = "", count = 1, description = "") {
  return {
    id: `card-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name,
    count,
    description,
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
    cards: state.cards.map((card) => ({
      id: typeof card.id === "string" ? card.id : createCard().id,
      name: String(card.name ?? ""),
      count: card.count ?? 1,
      description: String(card.description ?? ""),
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
    const cards = Array.isArray(parsed?.cards)
      ? parsed.cards.map((card) => ({
          id: typeof card?.id === "string" ? card.id : createCard().id,
          name: String(card?.name ?? ""),
          count: card?.count ?? 1,
          description: String(card?.description ?? ""),
        }))
      : [];

    state.cards = cards;
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

  const orderedCardTemplates = cards.map((card) => ({
    name: escapeJsonText(card.name),
    count: normalizeCount(card.count),
    description: String(card.description ?? ""),
  }));

  return {
    validation,
    json: {
      ordered_card_templates: orderedCardTemplates,
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
      ordered_card_templates: [],
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

function renderCards() {
  elements.cardList.innerHTML = "";
  elements.emptyState.classList.toggle("is-visible", state.cards.length === 0);

  appendInsertSlot(0);

  state.cards.forEach((card, index) => {
    const fragment = elements.cardTemplate.content.cloneNode(true);
    const cardRow = fragment.querySelector(".card-row");
    const rowIndex = fragment.querySelector(".row-index");
    const nameInput = fragment.querySelector(".name-input");
    const countInput = fragment.querySelector(".count-input");
    const descriptionInput = fragment.querySelector(".description-input");
    const deleteButton = fragment.querySelector(".delete-button");

    rowIndex.textContent = `#${String(index + 1).padStart(2, "0")}`;
    nameInput.value = card.name;
    countInput.value = String(card.count);
    descriptionInput.value = card.description;
    deleteButton.dataset.cardId = card.id;
    cardRow.dataset.cardId = card.id;
    cardRow.dataset.index = String(index);

    nameInput.addEventListener("input", (event) => {
      state.cards[index].name = event.target.value;
      renderDerivedState();
    });

    countInput.addEventListener("input", (event) => {
      state.cards[index].count = event.target.value;
      renderDerivedState();
    });

    descriptionInput.addEventListener("input", (event) => {
      state.cards[index].description = event.target.value;
      resizeDescriptionTextarea(event.target);
      renderDerivedState();
    });

    deleteButton.addEventListener("click", () => {
      state.cards = state.cards.filter((item) => item.id !== card.id);
      setStatus("success", `已删除牌：${card.name || `第 ${index + 1} 项`}。`);
      render();
    });

    cardRow.addEventListener("dragstart", (event) => {
      state.dragIndex = index;
      cardRow.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", card.id);
    });

    cardRow.addEventListener("dragend", () => {
      state.dragIndex = null;
      cleanupDropTargets();
      render();
    });

    cardRow.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (state.dragIndex === null || state.dragIndex === index) {
        return;
      }

      cleanupDropTargets();
      cardRow.classList.add("is-drop-target");
      event.dataTransfer.dropEffect = "move";
    });

    cardRow.addEventListener("dragleave", () => {
      cardRow.classList.remove("is-drop-target");
    });

    cardRow.addEventListener("drop", (event) => {
      event.preventDefault();

      if (state.dragIndex === null || state.dragIndex === index) {
        cleanupDropTargets();
        return;
      }

      const nextCards = [...state.cards];
      const [movedCard] = nextCards.splice(state.dragIndex, 1);
      nextCards.splice(index, 0, movedCard);
      state.cards = nextCards;
      state.dragIndex = null;
      setStatus("success", "已更新卡牌顺序。");
      cleanupDropTargets();
      render();
    });

    elements.cardList.appendChild(fragment);
    resizeDescriptionTextarea(descriptionInput);
    appendInsertSlot(index + 1);
  });
}

function appendInsertSlot(index) {
  const fragment = elements.insertTemplate.content.cloneNode(true);
  const button = fragment.querySelector(".insert-button");
  button.dataset.insertIndex = String(index);
  button.addEventListener("click", () => {
    addCardAt(index);
  });
  elements.cardList.appendChild(fragment);
}

function cleanupDropTargets() {
  elements.cardList.querySelectorAll(".is-drop-target").forEach((node) => {
    node.classList.remove("is-drop-target");
  });
}

function render() {
  renderCards();
  renderDerivedState();
}

function addCardAt(index) {
  state.cards.splice(index, 0, createCard("", 1, ""));
  setStatus("success", `已在第 ${index + 1} 个位置插入一张牌。`);
  render();
}

function loadCardsFromJson(json, sourceLabel) {
  try {
    const orderedCardTemplates = json?.ordered_card_templates;

    if (!Array.isArray(orderedCardTemplates)) {
      throw new Error("缺少合法的 ordered_card_templates 数组。");
    }

    const cards = orderedCardTemplates.map((card, index) => {
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

      return createCard(name, count, String(card.description ?? ""));
    });

    state.cards = cards;
    setStatus("success", `已导入 ${sourceLabel}，共 ${cards.length} 种牌。`);
    render();
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
  elements.newDeckButton.addEventListener("click", createEmptyDeck);
  elements.importButton.addEventListener("click", () => elements.fileInput.click());
  elements.loadSampleButton.addEventListener("click", loadSampleJson);
  elements.downloadButton.addEventListener("click", downloadJson);
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

bindEvents();
initializeApp();
