# DancingLine 对音工具执行方案

## 1. 目标

构建一个面向 DancingLine 谱面制作的音乐采音平台，用户可以导入音乐，在带有分段 BPM 的时间栅格中录入、编辑、对齐音符，最终导出 `txt` 文件。

导出文件支持两类行格式：

```txt
1234.56
timegroup 1234.56 180.0
```

- 普通音符行：一个浮点数，表示音符所在的毫秒时间。
- BPM 切换行：`timegroup 毫秒数 bpm数`，表示从该毫秒位置开始切换栅格 BPM。
- 所有时间与 BPM 均使用浮点数。
- 导出时由平台负责栅格对齐、排序、去重和格式化。

## 2. 核心能力

### 2.1 音乐导入与播放

- 支持导入本地音频文件，优先支持 `mp3`、`wav`、`ogg`。
- 展示音频波形，提供时间轴缩放与拖拽。
- 支持播放、暂停、跳转、变速播放。
- 支持快捷键：空格播放/暂停，方向键微调播放位置。
- 播放头与编辑栅格实时同步。

### 2.2 分段 BPM

- 用户可以在任意毫秒位置创建 BPM 段。
- 每个 BPM 段包含：
  - 起始时间 `startMs`
  - BPM 值 `bpm`
  - 可选备注 `label`
- 第一个 BPM 段默认从 `0ms` 开始。
- BPM 段按时间升序排列。
- 修改某段 BPM 后，该段及后续栅格重新计算。
- 删除 BPM 段时，受影响范围内的音符保留原始毫秒时间，但显示时重新吸附到当前栅格。

### 2.3 任意分音

- 支持常见分音：`1/1`、`1/2`、`1/3`、`1/4`、`1/6`、`1/8`、`1/12`、`1/16`、`1/24`、`1/32`。
- 支持用户输入自定义分音，例如 `1/5`、`1/7`、`1/48`。
- 分音作用于当前 BPM 段的拍长。
- 平台根据 BPM 与分音生成可编辑栅格。
- 用户录入音符时，系统自动吸附到当前分音栅格。

### 2.4 音符录入与编辑

- 支持点击栅格添加音符。
- 支持播放时按键打点录入音符。
- 支持框选、删除、复制、粘贴音符。
- 支持音符拖拽到其他栅格位置。
- 支持音符毫秒级微调。
- 支持撤销/重做。
- 支持显示音符原始时间与吸附后时间差。

### 2.5 栅格对齐

- 所有栅格由平台根据 BPM 段自动生成。
- 音符存储时保留最终毫秒时间。
- 用户编辑时可以选择：
  - 强制吸附：音符永远落在最近栅格。
  - 临时自由：允许毫秒级微调，但导出前提示未对齐音符。
- 导出默认使用吸附后时间。

## 3. 数据模型

### 3.1 Project

```ts
type Project = {
  audioFile?: string;
  durationMs: number;
  bpmSegments: BpmSegment[];
  notes: Note[];
  editor: EditorState;
};
```

### 3.2 BPM 段

```ts
type BpmSegment = {
  id: string;
  startMs: number;
  bpm: number;
  label?: string;
};
```

### 3.3 音符

```ts
type Note = {
  id: string;
  timeMs: number;
  source: "grid" | "tap" | "manual";
};
```

### 3.4 编辑状态

```ts
type EditorState = {
  snapEnabled: boolean;
  division: number;
  zoom: number;
  currentTimeMs: number;
  selectedNoteIds: string[];
};
```

其中 `division` 表示每拍切成多少份：

```txt
1/4 -> division = 4
1/8 -> division = 8
1/12 -> division = 12
```

## 4. 栅格计算方案

### 4.1 基础公式

```txt
beatMs = 60000 / bpm
gridMs = beatMs / division
```

例如：

```txt
bpm = 180
division = 4
beatMs = 333.333333
gridMs = 83.333333
```

### 4.2 BPM 段范围

每个 BPM 段的有效范围为：

```txt
[当前段 startMs, 下一段 startMs)
```

最后一段范围为：

```txt
[最后一段 startMs, 音频结束时间]
```

### 4.3 栅格生成

对每个 BPM 段执行：

```txt
segmentStart = bpmSegment.startMs
segmentEnd = nextBpmSegment.startMs or durationMs
gridMs = 60000 / bpm / division

从 segmentStart 开始，每次累加 gridMs，直到 segmentEnd
```

生成的栅格点用于：

- 音符吸附。
- 时间轴刻度显示。
- 点击定位。
- 判断音符是否对齐。

### 4.4 最近栅格吸附

输入任意时间 `timeMs`：

1. 找到 `timeMs` 所在 BPM 段。
2. 根据该段 `startMs`、`bpm`、`division` 计算 `gridMs`。
3. 计算相对位置：

```txt
offset = timeMs - segmentStart
index = round(offset / gridMs)
snappedTime = segmentStart + index * gridMs
```

4. 限制结果在当前 BPM 段范围内。
5. 输出 `snappedTime`。

### 4.5 浮点误差处理

- 内部计算使用双精度浮点数。
- 比较时间时使用误差阈值，例如 `epsilon = 0.001ms`。
- 导出时统一格式化到最多 6 位小数。
- 如果格式化后为整数，可以输出整数形式或保留一位小数，建议统一保留最少必要小数。

## 5. 文件导出方案

### 5.1 导出内容

导出 `txt` 由 BPM 切换行和音符行组成。

示例：

```txt
timegroup 0 180
500
750
1000
timegroup 4000 210
4085.714286
4171.428571
```

### 5.2 排序规则

- 所有行按时间升序排序。
- 同一时间点如果同时存在 `timegroup` 和音符，`timegroup` 在前。
- 音符去重阈值建议为 `0.001ms`。

### 5.3 导出流程

1. 校验 BPM 段是否有效。
2. 校验音符是否存在负数时间或超出音频时长。
3. 根据当前吸附策略处理音符时间。
4. 合并 BPM 行与音符行。
5. 按时间排序。
6. 格式化浮点数。
7. 写出 `.txt` 文件。

### 5.4 导出校验

导出前提示以下问题：

- BPM 小于等于 0。
- BPM 段时间重复。
- 音符时间重复。
- 音符未对齐到当前栅格。
- 音符超出音频范围。

## 6. 交互设计

### 6.1 主界面

主界面分为 4 个区域：

- 顶部工具栏：导入音频、保存工程、导出 txt、播放控制、当前时间。
- 中央编辑区：波形、时间轴、栅格、音符点。
- 左侧参数区：当前 BPM、分音、吸附开关、缩放。
- 右侧列表区：BPM 段列表、音符列表、校验问题列表。

### 6.2 添加 BPM 段

用户可以通过两种方式添加：

- 在播放头位置点击“添加 BPM 段”。
- 在 BPM 列表中手动输入时间和 BPM。

添加后平台立即重新绘制栅格。

### 6.3 调整 BPM 段

- 修改 BPM 值后，该段栅格实时更新。
- 修改起始时间后，重新排序 BPM 段。
- 如果修改导致两个 BPM 段时间重叠或重复，阻止保存并提示。

### 6.4 录入音符

支持三种方式：

- 鼠标点击栅格。
- 播放时按快捷键打点。
- 在音符列表中输入毫秒数。

录入后如果吸附开启，立即吸附到最近栅格。

### 6.5 编辑音符

- 拖拽音符时实时显示目标毫秒数。
- 松手后根据吸附开关决定最终时间。
- 支持方向键微调，默认每次移动一个当前栅格单位。
- 按住修饰键时可进行毫秒级微调。

## 7. 工程架构建议

### 7.1 技术选型

如果做桌面或 Web 工具，建议使用：

- React + TypeScript：构建编辑界面。
- Web Audio API：音频播放、波形解析。
- Canvas：绘制波形、栅格、音符。
- Zustand 或 Redux：管理工程状态。
- File System Access API 或 Electron：保存工程与导出文件。

如果优先做轻量本地工具：

- Electron + React + TypeScript。
- 本地文件读写更稳定。
- 方便后续打包给谱师使用。

### 7.2 模块划分

```txt
src/
  app/
    App.tsx
  audio/
    audioPlayer.ts
    waveform.ts
  chart/
    grid.ts
    snap.ts
    exportTxt.ts
    validation.ts
  editor/
    editorStore.ts
    commands.ts
    history.ts
  ui/
    Toolbar.tsx
    TimelineCanvas.tsx
    BpmPanel.tsx
    NotePanel.tsx
```

### 7.3 核心函数

```ts
function getSegmentAtTime(timeMs: number, segments: BpmSegment[]): BpmSegment;

function getGridMs(bpm: number, division: number): number;

function snapTimeToGrid(
  timeMs: number,
  segments: BpmSegment[],
  division: number,
  durationMs: number
): number;

function exportTxt(project: Project): string;

function validateProject(project: Project): ValidationIssue[];
```

## 8. 开发阶段

### 阶段 1：最小可用版本

目标：可以导入音乐、设置 BPM、点击添加音符、导出 txt。

任务：

1. 初始化项目。
2. 实现音频导入与播放。
3. 实现基础时间轴和播放头。
4. 实现单 BPM 栅格。
5. 实现点击添加音符。
6. 实现 txt 导出。

验收标准：

- 能导入一首音乐。
- 能设置 BPM 和分音。
- 能在栅格上添加音符。
- 能导出普通音符行。

### 阶段 2：分段 BPM

目标：支持 `timegroup` 行和多个 BPM 段。

任务：

1. 实现 BPM 段数据结构。
2. 实现 BPM 段列表 UI。
3. 实现跨 BPM 段栅格生成。
4. 实现 BPM 段内吸附。
5. 实现导出 `timegroup` 行。

验收标准：

- 能创建多个 BPM 段。
- 不同段显示不同栅格间距。
- 导出文件包含正确 `timegroup` 行。

### 阶段 3：编辑体验增强

目标：提升实际采音效率。

任务：

1. 实现波形显示。
2. 实现播放时按键打点。
3. 实现音符拖拽、删除、框选。
4. 实现撤销/重做。
5. 实现音符列表和 BPM 列表联动。

验收标准：

- 用户可以边听边打点。
- 音符可以批量编辑。
- 错误操作可以撤销。

### 阶段 4：校验与精修

目标：保证导出文件稳定可用。

任务：

1. 实现工程校验。
2. 实现未对齐音符提示。
3. 实现重复音符检测。
4. 实现浮点格式化策略。
5. 增加示例工程与测试用例。

验收标准：

- 导出前能发现明显错误。
- 导出的 txt 顺序稳定、格式稳定。
- 栅格吸附算法有单元测试覆盖。

## 9. 测试方案

### 9.1 单元测试

重点测试：

- BPM 段排序。
- 时间所在 BPM 段查找。
- 任意分音的栅格间隔计算。
- 最近栅格吸附。
- 跨 BPM 段吸附边界。
- txt 导出排序。
- `timegroup` 与普通音符同时间排序。
- 浮点格式化。

### 9.2 手动测试

测试场景：

- 单 BPM 全曲采音。
- 多 BPM 切换采音。
- 三连音、五连音、七连音等自定义分音。
- BPM 段起点附近添加音符。
- 导出后重新导入检查一致性。

## 10. 风险与处理

### 10.1 浮点误差

风险：BPM 和分音可能产生无限小数，导致导出结果抖动。

处理：内部保留双精度，比较使用 `epsilon`，导出统一格式化。

### 10.2 BPM 段边界

风险：音符刚好落在两个 BPM 段边界时归属不清。

处理：使用左闭右开区间，边界点归属后一段。

### 10.3 波形渲染性能

风险：长音频绘制波形卡顿。

处理：预计算降采样波形数据，Canvas 只绘制当前可视区。

### 10.4 打点延迟

风险：播放时按键打点存在输入延迟。

处理：记录按键事件时间戳与 AudioContext 时间，提供整体延迟校准参数。

## 11. 推荐优先级

第一优先级：

- 音频播放。
- BPM 栅格。
- 音符添加。
- txt 导出。

第二优先级：

- 分段 BPM。
- 任意分音。
- 吸附与校验。

第三优先级：

- 波形。
- 快捷键打点。
- 批量编辑。
- 撤销/重做。

## 12. 最小导出示例

```txt
timegroup 0 180
0
333.333333
666.666667
timegroup 2000 210
2000
2285.714286
2571.428571
```

这份文件表示：

- 从 `0ms` 开始使用 `180 BPM`。
- 在 `0ms`、`333.333333ms`、`666.666667ms` 有音符。
- 从 `2000ms` 开始切换为 `210 BPM`。
- 在 `2000ms`、`2285.714286ms`、`2571.428571ms` 有音符。
