'use strict';
// One dataset drives the webpage and PNG export.
const series = [
 {
  "name": "ChatGPT",
  "company": "OpenAI",
  "color": "#267d70",
  "sources": [
   [
    "官方 API 更新日志",
    "https://developers.openai.com/api/docs/changelog"
   ],
   [
    "ChatGPT 首发公告",
    "https://openai.com/index/chatgpt/"
   ],
   [
    "GPT-4 发布",
    "https://openai.com/index/gpt-4-research/"
   ],
   [
    "GPT-5 发布",
    "https://openai.com/index/introducing-gpt-5/"
   ],
   [
    "GPT-1 原始发布",
    "https://openai.com/index/language-unsupervised/"
   ],
   [
    "GPT-2 原始发布",
    "https://openai.com/index/better-language-models/"
   ],
   [
    "GPT-3 原始论文",
    "https://arxiv.org/abs/2005.14165"
   ],
   [
    "GPT-4.5 官方记录",
    "https://developers.openai.com/api/docs/changelog"
   ],
   [
    "GPT-4.1 官方记录",
    "https://developers.openai.com/api/docs/changelog"
   ],
   [
    "GPT-5.1 官方记录",
    "https://developers.openai.com/api/docs/changelog"
   ],
   [
    "GPT-5.2 官方记录",
    "https://developers.openai.com/api/docs/changelog"
   ],
   [
    "GPT-5.3 Instant 官方记录",
    "https://developers.openai.com/api/docs/changelog"
   ],
   [
    "GPT-5.4 官方记录",
    "https://developers.openai.com/api/docs/changelog"
   ],
   [
    "GPT-5.5 官方记录",
    "https://developers.openai.com/api/docs/changelog"
   ],
   [
    "GPT-5.6 官方记录",
    "https://developers.openai.com/api/docs/changelog"
   ],
   [
    "GPT-6 Sol / Luna 官方记录",
    "https://developers.openai.com/api/docs/changelog"
   ],
   [
    "GPT-5.3 Codex 发布记录",
    "https://openai.com/index/introducing-gpt-5-3-codex/"
   ],
   [
    "GPT-4o 官方发布页",
    "https://openai.com/index/hello-gpt-4o/"
   ],
   [
    "o1-preview 官方发布页",
    "https://openai.com/index/introducing-openai-o1-preview/"
   ],
   [
    "GPT-4.5 官方发布页",
    "https://openai.com/index/introducing-gpt-4-5/"
   ],
   [
    "o3 / o4-mini 官方发布页",
    "https://openai.com/index/introducing-o3-and-o4-mini/"
   ],
   [
    "GPT-4.1 官方发布页",
    "https://openai.com/index/gpt-4-1/"
   ],
   [
    "GPT-5.1 官方发布页",
    "https://openai.com/index/gpt-5-1/"
   ],
   [
    "GPT-5.2 官方发布页",
    "https://openai.com/index/introducing-gpt-5-2/"
   ],
   [
    "GPT-5.3 Instant 官方发布页",
    "https://openai.com/index/gpt-5-3-instant/"
   ],
   [
    "GPT-5.4 官方发布页",
    "https://openai.com/index/introducing-gpt-5-4/"
   ],
   [
    "GPT-5.5 官方发布页",
    "https://openai.com/index/introducing-gpt-5-5/"
   ],
   [
    "GPT-5.6 官方模型文档",
    "https://developers.openai.com/api/docs/models/gpt-5.6-sol"
   ],
   [
    "GPT-6 Astra 官方发布页",
    "https://openai.com/index/gpt-6-astra/"
   ],
   [
    "GPT-6 Sol / Luna 官方发布页",
    "https://openai.com/index/introducing-gpt-6-sol-and-luna/"
   ],
   [
    "GPT-6.1 Sol 官方发布页",
    "https://openai.com/index/introducing-gpt-6-1-sol/"
   ],
   [
    "GPT-6.1 Terra 官方发布页",
    "https://openai.com/index/introducing-gpt-6-1-terra/"
   ],
   [
    "GPT-6.1 Terra 官方模型文档",
    "https://developers.openai.com/api/docs/models/gpt-6.1-terra"
   ]
  ],
  "events": [
   [
    "2018.06",
    "GPT-1",
    "生成式预训练与任务微调",
    4
   ],
   [
    "2019.02",
    "GPT-2",
    "扩大语言模型规模；零样本任务能力",
    5
   ],
   [
    "2020.05",
    "GPT-3",
    "1750 亿参数；上下文少样本学习",
    6
   ],
   [
    "2022.11",
    "GPT-3.5",
    "以 GPT-3.5 开启大众对话体验",
    1,
    "p"
   ],
   [
    "2023.03",
    "GPT-4",
    "强化推理与图像理解",
    2
   ],
   [
    "2024.05",
    "GPT-4o",
    "文本、视觉、语音一体化",
    17
   ],
   [
    "2024.09",
    "o1-preview",
    "推理模型路线开启",
    18
   ],
   [
    "2025.02",
    "GPT-4.5",
    "官方发布的小版本更新",
    19
   ],
   [
    "2025.04",
    "o3 / o4-mini",
    "推理与工具协作",
    20
   ],
   [
    "2025.04",
    "GPT-4.1",
    "官方发布的小版本更新",
    21
   ],
   [
    "2025.08",
    "GPT-5",
    "整合快速回答与深入思考",
    3
   ],
   [
    "2025.11",
    "GPT-5.1",
    "官方发布的小版本更新",
    22
   ],
   [
    "2025.12",
    "GPT-5.2",
    "官方发布的小版本更新",
    23
   ],
   [
    "2026.02",
    "GPT-5.3 Codex",
    "编程分支；Codex 产品首发",
    16
   ],
   [
    "2026.03",
    "GPT-5.3 Instant",
    "官方发布的小版本更新",
    24
   ],
   [
    "2026.03",
    "GPT-5.4",
    "官方发布的小版本更新",
    25
   ],
   [
    "2026.04",
    "GPT-5.5",
    "官方发布的小版本更新",
    26
   ],
   [
    "2026.07",
    "GPT-5.6",
    "官方发布的小版本更新",
    27
   ],
   [
    "2026.09",
    "GPT-6 Astra",
    "面向复杂任务的端到端执行",
    28
   ],
   [
    "2026.09",
    "GPT-6 Sol / Luna",
    "官方发布的小版本更新",
    29
   ],
   [
    "2026.09",
    "GPT-6.1 Sol",
    "API 发布：编程与专业工作",
    30
   ],
   [
    "2026.10",
    "GPT-6.1 Terra",
    "面向视觉推理、精确计算机操作及自然写作的高效模型",
    31,
    "",
    "2026-10-26"
   ]
  ],
  "website": "https://chatgpt.com/"
 },
 {
  "name": "Claude",
  "company": "Anthropic",
  "color": "#b66a4d",
  "sources": [
   [
    "Claude 首发公告",
    "https://www.anthropic.com/news/introducing-claude"
   ],
   [
    "Claude 2",
    "https://www.anthropic.com/news/claude-2"
   ],
   [
    "Claude 3 家族",
    "https://www.anthropic.com/news/claude-3-family"
   ],
   [
    "Claude 3.5 Sonnet 与 Artifacts",
    "https://www.anthropic.com/news/claude-3-5-sonnet"
   ],
   [
    "Claude 3.7 与 Claude Code",
    "https://www.anthropic.com/news/claude-3-7-sonnet"
   ],
   [
    "Claude 4",
    "https://www.anthropic.com/news/claude-4"
   ],
   [
    "Claude Opus 4.6",
    "https://www.anthropic.com/news/claude-opus-4-6"
   ],
   [
    "2026 年 9 月：Opus / Sonnet 5.5",
    "https://www.anthropic.com/news"
   ],
   [
    "Claude 2.1 官方记录",
    "https://www.anthropic.com/news/claude-2-1"
   ],
   [
    "Claude 3.5 Sonnet v2 官方记录",
    "https://www.anthropic.com/news/3-5-models-and-computer-use"
   ],
   [
    "Claude Opus 4.1 官方记录",
    "https://www.anthropic.com/news/claude-opus-4-1"
   ],
   [
    "Claude Sonnet 4.5 官方记录",
    "https://www.anthropic.com/news/claude-sonnet-4-5"
   ],
   [
    "Claude Haiku 4.5 官方记录",
    "https://www.anthropic.com/news/claude-haiku-4-5"
   ],
   [
    "Claude Opus 4.5 官方记录",
    "https://www.anthropic.com/news/claude-opus-4-5"
   ],
   [
    "Claude Sonnet 4.6 官方记录",
    "https://www.anthropic.com/news/claude-sonnet-4-6"
   ],
   [
    "Claude Opus 4.7 官方记录",
    "https://www.anthropic.com/news/claude-opus-4-7"
   ],
   [
    "Claude Opus 4.8 官方记录",
    "https://www.anthropic.com/news/claude-opus-4-8"
   ],
   [
    "Claude Fable / Mythos 5 官方记录",
    "https://www.anthropic.com/claude/fable"
   ],
   [
    "Claude Sonnet 5 官方记录",
    "https://www.anthropic.com/news/claude-sonnet-5"
   ],
   [
    "Claude Opus 5 官方记录",
    "https://www.anthropic.com/claude/opus"
   ],
   [
    "Claude Fable / Mythos 5.1 官方记录",
    "https://www.anthropic.com/claude-fable-and-mythos-5-1"
   ],
   [
    "Claude Opus 5.5 官方记录",
    "https://www.anthropic.com/claude-opus-5-5"
   ],
   [
    "Claude Sonnet 5.5 官方记录",
    "https://www.anthropic.com/claude-sonnet-5-5"
   ],
   [
    "Claude Haiku 5.5 官方记录",
    "https://www.anthropic.com/claude-haiku-5-5"
   ],
   [
    "Claude 1.3 发布记录",
    "https://proceedings.neurips.cc/paper_files/paper/2023/file/fd6613131889a4b656206c50a8bd7790-Paper-Conference.pdf"
   ],
   [
    "Claude Instant 1.2 发布记录",
    "https://www.anthropic.com/news/releasing-claude-instant-1-2"
   ],
   [
    "早期版本目录：Claude 1.0 / 1.1 / 1.2、Instant 1.0 / 1.1；独立首发日期待核实",
    "https://platform.claude.com/docs/en/about-claude/model-deprecations"
   ],
   [
    "Claude 早期测试 原始记录",
    "https://scale.com/blog/chatgpt-vs-claude"
   ],
   [
    "Claude Fable / Mythos 5 · 版本资料",
    "https://www.anthropic.com/news/claude-fable-5-mythos-5"
   ],
   [
    "Claude Opus 5 · 版本资料",
    "https://www.anthropic.com/news/claude-opus-5"
   ]
  ],
  "events": [
   [
    "2023.01",
    "Claude 早期测试",
    "早期测试记录：Scale 获 Anthropic 授权后公开实际对话与评测",
    27
   ],
   [
    "2023.03",
    "Claude 1",
    "强调有用、诚实、无害",
    0
   ],
   [
    "2023.04",
    "Claude 1.3",
    "研究论文记录的发布日期",
    24
   ],
   [
    "2023.07",
    "Claude 2",
    "100K 上下文；公开聊天网站",
    1
   ],
   [
    "2023.08",
    "Claude Instant 1.2",
    "轻量分支；相比 Instant 1.1 提升代码、数学与安全能力",
    25
   ],
   [
    "2023.11",
    "Claude 2.1",
    "官方发布的小版本更新",
    8
   ],
   [
    "2024.03",
    "Claude 3",
    "Opus / Sonnet / Haiku 三档",
    2
   ],
   [
    "2024.06",
    "Claude 3.5 Sonnet",
    "编程增强；Artifacts 同期推出",
    3
   ],
   [
    "2024.10",
    "Claude 3.5 Sonnet v2",
    "官方发布的小版本更新",
    9
   ],
   [
    "2025.02",
    "Claude 3.7 Sonnet",
    "混合推理；Claude Code 预览",
    4
   ],
   [
    "2025.05",
    "Claude 4",
    "Opus 4 / Sonnet 4；长任务与 Agent",
    5
   ],
   [
    "2025.08",
    "Claude Opus 4.1",
    "官方发布的小版本更新",
    10
   ],
   [
    "2025.09",
    "Claude Sonnet 4.5",
    "官方发布的小版本更新",
    11
   ],
   [
    "2025.10",
    "Claude Haiku 4.5",
    "官方发布的小版本更新",
    12
   ],
   [
    "2025.11",
    "Claude Opus 4.5",
    "官方发布的小版本更新",
    13
   ],
   [
    "2026.02",
    "Claude Opus 4.6",
    "长任务与编程持续迭代",
    6
   ],
   [
    "2026.02",
    "Claude Sonnet 4.6",
    "官方发布的小版本更新",
    14
   ],
   [
    "2026.04",
    "Claude Opus 4.7",
    "官方发布的小版本更新",
    15
   ],
   [
    "2026.05",
    "Claude Opus 4.8",
    "官方发布的小版本更新",
    16
   ],
   [
    "2026.06",
    "Claude Fable / Mythos 5",
    "官方发布的小版本更新",
    28
   ],
   [
    "2026.06",
    "Claude Sonnet 5",
    "官方发布的小版本更新",
    18
   ],
   [
    "2026.07",
    "Claude Opus 5",
    "官方发布的小版本更新",
    29
   ],
   [
    "2026.09",
    "Claude Fable / Mythos 5.1",
    "官方发布的小版本更新",
    20
   ],
   [
    "2026.09",
    "Claude Opus 5.5",
    "官方发布的小版本更新",
    21
   ],
   [
    "2026.09",
    "Claude Sonnet 5.5",
    "官方发布的小版本更新",
    22
   ],
   [
    "2026.10",
    "Claude Haiku 5.5",
    "官方发布的小版本更新",
    23
   ]
  ],
  "website": "https://claude.ai/"
 },
 {
  "name": "DeepSeek",
  "company": "深度求索",
  "color": "#417db5",
  "sources": [
   [
    "DeepSeek Coder 官方仓库",
    "https://github.com/deepseek-ai/DeepSeek-Coder"
   ],
   [
    "DeepSeek LLM 官方仓库",
    "https://github.com/deepseek-ai/DeepSeek-LLM"
   ],
   [
    "DeepSeek-V2 论文",
    "https://arxiv.org/abs/2405.04434"
   ],
   [
    "DeepSeek-V3 发布公告",
    "https://www.deepseek.com/news/deepseek-v3/"
   ],
   [
    "R1 官方仓库",
    "https://github.com/deepseek-ai/DeepSeek-R1"
   ],
   [
    "官方更新日志（V3.2 / V4.1）",
    "https://api-docs.deepseek.com/updates/"
   ],
   [
    "V4 预览版公告",
    "https://www.deepseek.com/news/v4-preview/"
   ],
   [
    "DeepSeek-V2.5 官方记录",
    "https://api-docs.deepseek.com/updates/"
   ],
   [
    "DeepSeek-V3.1 官方记录",
    "https://api-docs.deepseek.com/updates/"
   ],
   [
    "DeepSeek-V3.1-Terminus 官方记录",
    "https://api-docs.deepseek.com/updates/"
   ],
   [
    "DeepSeek-V3.2-Exp 官方记录",
    "https://api-docs.deepseek.com/updates/"
   ],
   [
    "DeepSeek-Coder 原始记录",
    "https://github.com/deepseek-ai/DeepSeek-Coder"
   ],
   [
    "DeepSeek-V2.5 · 版本资料",
    "https://api-docs.deepseek.com/news/news0905"
   ],
   [
    "DeepSeek-V3.1 · 版本资料",
    "https://api-docs.deepseek.com/news/news250821"
   ],
   [
    "DeepSeek-V3.1-Terminus · 版本资料",
    "https://api-docs.deepseek.com/news/news250922"
   ],
   [
    "DeepSeek-V3.2-Exp · 版本资料",
    "https://api-docs.deepseek.com/news/news250929"
   ],
   [
    "DeepSeek-V3.2 · 版本资料",
    "https://api-docs.deepseek.com/news/news251201"
   ],
   [
    "DeepSeek-V4.1-Flash · 版本资料",
    "https://api-docs.deepseek.com/news/news260910"
   ],
   [
    "DeepSeek-V4.1-Flash-1017 官方模型卡",
    "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash-1017"
   ],
   [
    "2026.10.17 官方更新公告",
    "https://api-docs.deepseek.com/updates/#date-2026-10-17"
   ]
  ],
  "events": [
   [
    "2023.11",
    "DeepSeek-Coder",
    "首次开源代码模型系列，早于同月的 DeepSeek LLM",
    11
   ],
   [
    "2023.11",
    "DeepSeek LLM 67B",
    "开放通用基础与对话模型",
    1
   ],
   [
    "2024.05",
    "DeepSeek-V2",
    "MoE + MLA，提升推理效率",
    2
   ],
   [
    "2024.09",
    "DeepSeek-V2.5",
    "官方发布的小版本更新",
    12
   ],
   [
    "2024.12",
    "DeepSeek-V3",
    "扩展通用能力与训练效率",
    3
   ],
   [
    "2025.01",
    "DeepSeek-R1",
    "开放推理模型与蒸馏模型",
    4
   ],
   [
    "2025.08",
    "DeepSeek-V3.1",
    "官方发布的小版本更新",
    13
   ],
   [
    "2025.09",
    "DeepSeek-V3.1-Terminus",
    "官方发布的小版本更新",
    14
   ],
   [
    "2025.09",
    "DeepSeek-V3.2-Exp",
    "官方发布的小版本更新",
    15
   ],
   [
    "2025.12",
    "DeepSeek-V3.2",
    "推理与工具使用进一步结合",
    16
   ],
   [
    "2026.04",
    "DeepSeek-V4 预览",
    "Pro / Flash；百万上下文",
    6
   ],
   [
    "2026.09",
    "DeepSeek-V4.1-Flash",
    "原生多模态视觉理解",
    17
   ],
   [
    "2026.10",
    "DeepSeek-V4.1-Flash-1017",
    "提升推理、编程、智能体及视觉能力，减少任务耗时与输出长度",
    18,
    "",
    "2026-10-17"
   ]
  ],
  "website": "https://www.deepseek.com/"
 },
 {
  "name": "GLM",
  "company": "智谱 · Z.ai",
  "color": "#8a68a5",
  "sources": [
   [
    "GLM-130B 研究团队公告",
    "https://keg.cs.tsinghua.edu.cn/glm-130b/posts/glm-130b/"
   ],
   [
    "ChatGLM-6B 官方仓库",
    "https://github.com/zai-org/ChatGLM-6B"
   ],
   [
    "GLM 家族发展论文（至 GLM-4）",
    "https://arxiv.org/abs/2406.12793"
   ],
   [
    "GLM-4.5 官方模型卡",
    "https://huggingface.co/zai-org/GLM-4.5"
   ],
   [
    "GLM-5 / 5.3-Flash 官方发布记录",
    "https://docs.z.ai/release-notes/new-released"
   ],
   [
    "GLM-4.1V-Thinking 官方记录",
    "https://github.com/zai-org/GLM-V"
   ],
   [
    "GLM-4.6 官方记录",
    "https://docs.z.ai/release-notes/new-released"
   ],
   [
    "GLM-4.7 官方记录",
    "https://docs.z.ai/release-notes/new-released"
   ],
   [
    "GLM-5.1 官方记录",
    "https://docs.z.ai/release-notes/new-released"
   ],
   [
    "GLM-5.2 官方记录",
    "https://docs.z.ai/release-notes/new-released"
   ],
   [
    "GLM-5.3 官方记录",
    "https://docs.z.ai/release-notes/new-released"
   ],
   [
    "GLM 原始记录",
    "https://arxiv.org/abs/2103.10360"
   ],
   [
    "GLM-4.1V-Thinking · 版本资料",
    "https://huggingface.co/zai-org/GLM-4.1V-9B-Thinking"
   ],
   [
    "GLM-4.6 · 版本资料",
    "https://z.ai/blog/glm-4.6"
   ],
   [
    "GLM-4.7 · 版本资料",
    "https://z.ai/blog/glm-4.7"
   ],
   [
    "GLM-5 · 版本资料",
    "https://z.ai/blog/glm-5"
   ],
   [
    "GLM-5.1 · 版本资料",
    "https://z.ai/blog/glm-5.1"
   ],
   [
    "GLM-5.2 · 版本资料",
    "https://z.ai/blog/glm-5.2"
   ],
   [
    "GLM-5.3 · 版本资料",
    "https://z.ai/blog/glm-5.3"
   ],
   [
    "GLM-5.3-Flash · 版本资料",
    "https://z.ai/blog/glm-5.3-flash"
   ]
  ],
  "events": [
   [
    "2021.03",
    "GLM",
    "研究发布：GLM 预训练方法与模型；自回归空白填充",
    11
   ],
   [
    "2022.08",
    "GLM-130B",
    "中英双语开放模型",
    0
   ],
   [
    "2023.03",
    "ChatGLM-6B",
    "开源中英双语对话模型",
    1
   ],
   [
    "2024.01",
    "GLM-4",
    "通用能力与工具调用升级",
    2
   ],
   [
    "2025.07",
    "GLM-4.1V-Thinking",
    "官方发布的小版本更新",
    12
   ],
   [
    "2025.07",
    "GLM-4.5",
    "推理、代码、Agent 融合",
    3
   ],
   [
    "2025.09",
    "GLM-4.6",
    "官方发布的小版本更新",
    13
   ],
   [
    "2025.12",
    "GLM-4.7",
    "官方发布的小版本更新",
    14
   ],
   [
    "2026.02",
    "GLM-5",
    "复杂软件工程与 Agent",
    15
   ],
   [
    "2026.04",
    "GLM-5.1",
    "官方发布的小版本更新",
    16
   ],
   [
    "2026.06",
    "GLM-5.2",
    "官方发布的小版本更新",
    17
   ],
   [
    "2026.08",
    "GLM-5.3",
    "官方发布的小版本更新",
    18
   ],
   [
    "2026.08",
    "GLM-5.3-Flash",
    "原生多模态与成本优化",
    19
   ]
  ],
  "website": "https://z.ai/"
 },
 {
  "name": "豆包",
  "company": "字节跳动",
  "color": "#5b6ab4",
  "sources": [
   [
    "豆包上线月份（百科交叉参考）",
    "https://zh.wikipedia.org/wiki/豆包_(聊天机器人)"
   ],
   [
    "2024 年豆包大模型家族发布",
    "https://developer.volcengine.com/articles/7369628105754804261"
   ],
   [
    "豆包 1.5 / 1.6 发布记录（开发者社区）",
    "https://developer.volcengine.com/articles/7534023665457823780"
   ],
   [
    "Seed2.0 官方发布公告",
    "https://seed.bytedance.com/zh/blog/seed2-0-正式发布"
   ],
   [
    "Seed2.1 官方发布公告",
    "https://seed.bytedance.com/zh/blog/seed2-1-officially-released-advancing-ai-productivity"
   ],
   [
    "Doubao Pro 240515 官方版本记录",
    "https://docs.volcengine.com/docs/vector_database_vikingdb/Modeldeprecationandsunsetpolicy?lang=zh"
   ],
   [
    "豆包 1.8 官方记录",
    "https://seed.bytedance.com/zh/seed1_8/"
   ],
   [
    "豆包 邀请测试 原始记录",
    "https://www.eeo.com.cn/2023/0818/601827.shtml"
   ],
   [
    "Doubao-pro-32k-240515 · 版本资料",
    "https://docs.volcengine.com/docs/vector_database_vikingdb/Modeldeprecationandsunsetpolicy?lang=zh#:~:text=doubao-pro-32k-240515"
   ],
   [
    "豆包 1.5 Pro · 版本资料",
    "https://seed.bytedance.com/en/special/doubao_1_5_pro"
   ],
   [
    "豆包 1.6 · 版本资料",
    "https://seed.bytedance.com/en/blog/introduction-to-techniques-used-in-seed1-6"
   ]
  ],
  "events": [
   [
    "2023.08",
    "豆包 邀请测试",
    "产品事件：豆包聊天产品开始邀请测试，当时底层模型称云雀",
    7
   ],
   [
    "2024.05",
    "Doubao-pro-32k-240515",
    "经火山引擎向企业提供服务",
    8
   ],
   [
    "2025.01",
    "豆包 1.5 Pro",
    "稀疏 MoE 基础模型",
    9
   ],
   [
    "2025.06",
    "豆包 1.6",
    "深度思考与多模态能力升级",
    10
   ],
   [
    "2025.12",
    "豆包 1.8",
    "官方发布的小版本更新",
    6
   ],
   [
    "2026.02",
    "Doubao-Seed-2.0",
    "面向真实工作任务",
    3
   ],
   [
    "2026.06",
    "Doubao-Seed-2.1",
    "强化推理与 Agent 生产力",
    4
   ]
  ],
  "website": "https://www.doubao.com/"
 },
 {
  "name": "Gemini",
  "company": "Google DeepMind",
  "color": "#c68a36",
  "sources": [
   [
    "Gemini 1.0 首发",
    "https://blog.google/innovation-and-ai/technology/ai/google-gemini-ai/"
   ],
   [
    "Gemini 1.0 Ultra",
    "https://blog.google/intl/en-africa/products/explore-get-answers/bard-becomes-gemini-try-ultra-10-and-a-new-mobile-app-today/"
   ],
   [
    "Gemini 1.5",
    "https://blog.google/innovation-and-ai/products/google-gemini-next-generation-model-february-2024/"
   ],
   [
    "Gemini 2.0",
    "https://blog.google/innovation-and-ai/models-and-research/google-deepmind/google-gemini-ai-update-december-2024/"
   ],
   [
    "Gemini 2.5",
    "https://blog.google/innovation-and-ai/models-and-research/google-deepmind/gemini-model-thinking-updates-march-2025/"
   ],
   [
    "Gemini 3",
    "https://blog.google/products-and-platforms/products/gemini/gemini-3/"
   ],
   [
    "Gemini 3.1 Pro 预览",
    "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-pro/"
   ],
   [
    "Gemini 3.5 Flash 官方记录",
    "https://blog.google/intl/en-africa/products/explore-get-answers/gemini-3-5/"
   ],
   [
    "Gemini 3.6 Flash 官方记录",
    "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-6-flash-3-5-flash-lite-3-5-flash-cyber/"
   ],
   [
    "Gemini 3.7 Flash 官方记录",
    "https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-3-7-flash/"
   ],
   [
    "Gemini 3.8 Flash 官方记录",
    "https://blog.google/innovation-and-ai/models-and-research/gemini-models/3-8-flash-and-3-8-flash-cyber/"
   ],
   [
    "Gemini 4 Argon 官方记录",
    "https://blog.google/intl/en-in/products/introducing-gemini-4-argon/"
   ],
   [
    "Gemini 研发预告 原始记录",
    "https://blog.google/innovation-and-ai/technology/ai/google-io-2023-keynote-sundar-pichai/"
   ],
   [
    "Gemini 4 Carbon 官方发布",
    "https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-carbon/"
   ]
  ],
  "events": [
   [
    "2023.12",
    "Gemini 1.0",
    "原生多模态；Ultra / Pro / Nano",
    0
   ],
   [
    "2024.02",
    "Gemini 1.0 Ultra",
    "Ultra 模型随 Gemini Advanced 上线",
    1,
    "p"
   ],
   [
    "2024.02",
    "Gemini 1.5",
    "百万 token 长上下文预览",
    2
   ],
   [
    "2024.12",
    "Gemini 2.0",
    "多模态与 Agent 能力推进",
    3
   ],
   [
    "2025.03",
    "Gemini 2.5",
    "以思考模型强化推理",
    4
   ],
   [
    "2025.11",
    "Gemini 3",
    "推理、多模态与 Agent 升级",
    5
   ],
   [
    "2026.02",
    "Gemini 3.1 Pro 预览",
    "增强复杂问题推理",
    6
   ],
   [
    "2026.05",
    "Gemini 3.5 Flash",
    "官方发布的小版本更新",
    7
   ],
   [
    "2026.07",
    "Gemini 3.6 Flash",
    "官方发布的小版本更新",
    8
   ],
   [
    "2026.08",
    "Gemini 3.7 Flash",
    "官方发布的小版本更新",
    9
   ],
   [
    "2026.09",
    "Gemini 3.8 Flash",
    "官方发布的小版本更新",
    10
   ],
   [
    "2026.10",
    "Gemini 4 Argon",
    "官方发布的小版本更新",
    11
   ],
   [
    "2026.10",
    "Gemini 4 Carbon",
    "公布前沿模型，强化编程、长程智能体与网络安全能力；通过 Fairwind 计划向部分防御者和可信伙伴分阶段开放",
    13,
    "",
    "2026-10-28"
   ]
  ],
  "website": "https://gemini.google.com/"
 },
 {
  "name": "千问 Qwen",
  "company": "阿里巴巴 · 阿里云",
  "color": "#7062b4",
  "sources": [
   [
    "通义千问首发公告",
    "https://www.alibabagroup.com/en-US/document-1582482069362049024"
   ],
   [
    "Qwen-7B 官方开源许可与发布日期",
    "https://huggingface.co/Qwen/Qwen-7B/blob/main/LICENSE"
   ],
   [
    "Qwen2 官方发布",
    "https://qwenlm.github.io/blog/qwen2/"
   ],
   [
    "Qwen2.5 官方发布",
    "https://qwenlm.github.io/blog/qwen2.5/"
   ],
   [
    "Qwen3 官方发布",
    "https://qwenlm.github.io/blog/qwen3/"
   ],
   [
    "Qwen3-Coder 官方发布",
    "https://qwen.ai/blog?id=d927d7d2e59d059045ce758ded34f98c0186d2d7"
   ],
   [
    "Qwen3.5 官方发布",
    "https://qwen.ai/blog?id=qwen3.5"
   ],
   [
    "Qwen3.7 官方发布",
    "https://qwen.ai/blog?id=qwen3.7"
   ],
   [
    "Qwen1.5 官方记录",
    "https://qwenlm.github.io/blog/qwen1.5/"
   ],
   [
    "Qwen3.6 Plus 官方记录",
    "https://www.alibabacloud.com/en/press-room/alibaba-unveils-qwen3-6-plus-to-accelerate-agentic"
   ],
   [
    "Qwen3.8 Max 官方记录",
    "https://qwen.ai/blog?id=qwen3.8"
   ],
   [
    "Qwen-7B · 版本资料",
    "https://huggingface.co/Qwen/Qwen-7B"
   ]
  ],
  "events": [
   [
    "2023.04",
    "Qwen 1.0",
    "中英双语模型；企业场景内测",
    0
   ],
   [
    "2023.08",
    "Qwen-7B",
    "开放基础与对话模型",
    11
   ],
   [
    "2024.02",
    "Qwen1.5",
    "官方发布的小版本更新",
    8
   ],
   [
    "2024.06",
    "Qwen2",
    "扩展多语言与长上下文",
    2
   ],
   [
    "2024.09",
    "Qwen2.5",
    "通用、代码、数学系列升级",
    3
   ],
   [
    "2025.04",
    "Qwen3",
    "思考与非思考双模式",
    4
   ],
   [
    "2025.07",
    "Qwen3-Coder",
    "面向 Agent 的编程模型",
    5
   ],
   [
    "2026.02",
    "Qwen3.5",
    "原生多模态与 Agent 能力",
    6
   ],
   [
    "2026.04",
    "Qwen3.6 Plus",
    "官方发布的小版本更新",
    9
   ],
   [
    "2026.05",
    "Qwen3.7",
    "面向复杂 Agent 工作流",
    7
   ],
   [
    "2026.08",
    "Qwen3.8 Max",
    "官方发布的小版本更新",
    10
   ]
  ],
  "website": "https://qwen.ai/"
 },
 {
  "name": "小米 MiMo",
  "company": "Xiaomi",
  "color": "#cb6e43",
  "sources": [
   [
    "MiMo-7B 官方仓库",
    "https://github.com/XiaomiMiMo/MiMo"
   ],
   [
    "小米 2025 中期报告（4 月 MiMo 首发）",
    "https://ir.mi.com/static-files/29a59068-f19f-4199-9114-4450211c9461"
   ],
   [
    "MiMo-VL 技术报告",
    "https://arxiv.org/abs/2506.03569"
   ],
   [
    "MiMo-V2-Flash 官方仓库",
    "https://github.com/XiaomiMiMo/MiMo-V2-Flash"
   ],
   [
    "MiMo-V2-Omni 官方发布",
    "https://mimo.xiaomi.com/mimo-v2-omni"
   ],
   [
    "MiMo-V2.5 官方发布",
    "https://mimo.xiaomi.com/mimo-v2-5"
   ],
   [
    "MiMo-V2.6 官方发布记录",
    "https://mimo.mi.com/docs/en-US/news/latest"
   ],
   [
    "MiMo-V2.6 技术报告",
    "https://arxiv.org/abs/2610.11959"
   ],
   [
    "MiMo-V2.6 系列 · 版本资料",
    "https://mimo.xiaomi.com/mimo-v2-6"
   ]
  ],
  "events": [
   [
    "2025.04",
    "MiMo-7B",
    "开源推理模型；强化数学与代码",
    0
   ],
   [
    "2025.06",
    "MiMo-VL-7B",
    "视觉语言模型；增强视觉推理",
    2
   ],
   [
    "2025.12",
    "MiMo-V2-Flash",
    "高效推理、编程与 Agent",
    3
   ],
   [
    "2026.03",
    "MiMo-V2-Omni",
    "融合图像、视频与音频理解",
    4
   ],
   [
    "2026.04",
    "MiMo-V2.5 系列",
    "V2.5 / Pro；长任务与工具协作",
    5
   ],
   [
    "2026.09",
    "MiMo-V2.6 系列",
    "强化学习扩展；Pro / Flash",
    8
   ]
  ],
  "website": "https://mimo.xiaomi.com/"
 },
 {
  "name": "MiniMax",
  "company": "MiniMax · 稀宇科技",
  "color": "#ac587c",
  "sources": [
   [
    "abab6.5 系列官方公告",
    "https://www.minimax.cn/news/通用大模型abab65系列"
   ],
   [
    "MiniMax-01 技术报告",
    "https://arxiv.org/abs/2501.08313"
   ],
   [
    "MiniMax-M1 官方仓库",
    "https://github.com/MiniMax-AI/MiniMax-M1"
   ],
   [
    "MiniMax M2 官方发布",
    "https://www.minimax.io/news/minimax-m2"
   ],
   [
    "MiniMax M2.7 官方发布",
    "https://www.minimax.io/news/minimax-m27-en"
   ],
   [
    "MiniMax M3 官方发布",
    "https://www.minimax.io/blog/minimax-m3"
   ],
   [
    "MiniMax M2.1 官方记录",
    "https://www.minimax.io/news/minimax-m21"
   ],
   [
    "MiniMax M2.5 官方记录",
    "https://www.minimax.io/news/minimax-m25"
   ],
   [
    "MiniMax M3.1 Flash Preview 官方记录",
    "https://agent.minimax.io/tools/m3-1-flash-preview"
   ],
   [
    "abab 1 原始记录",
    "https://www.hkexnews.hk/listedco/listconews/sehk/2025/1231/2025123100026_c.pdf"
   ],
   [
    "abab 2 原始记录",
    "https://www.hkexnews.hk/listedco/listconews/sehk/2025/1231/2025123100026_c.pdf"
   ],
   [
    "abab 3 原始记录",
    "https://www.hkexnews.hk/listedco/listconews/sehk/2025/1231/2025123100026_c.pdf"
   ],
   [
    "abab 5.5 原始记录",
    "https://www.hkexnews.hk/listedco/listconews/sehk/2025/1231/2025123100026_c.pdf"
   ],
   [
    "abab 6 原始记录",
    "https://www.hkexnews.hk/listedco/listconews/sehk/2025/1231/2025123100026_c.pdf"
   ],
   [
    "abab 1 · 版本资料",
    "https://www.hkexnews.hk/listedco/listconews/sehk/2025/1231/2025123100026_c.pdf#page=211"
   ],
   [
    "abab 5.5 · 版本资料",
    "https://www.hkexnews.hk/listedco/listconews/sehk/2025/1231/2025123100026_c.pdf#page=212"
   ],
   [
    "MiniMax M3.1 Flash 官方发布",
    "https://www.minimax.io/blog/minimax-m31f"
   ]
  ],
  "events": [
   [
    "2022.04",
    "abab 1",
    "2022 年 4 月推出，供自有产品内部使用；招股书第 201—202 页",
    14
   ],
   [
    "2022.06",
    "abab 2",
    "2022 年 6 月完成独立研发与训练；招股书第 201 页",
    14
   ],
   [
    "2022.10",
    "abab 3",
    "2022 年 10 月完成训练；招股书第 201 页",
    14
   ],
   [
    "2023.05",
    "abab 5.5",
    "2023 年 5 月发布；招股书第 202 页",
    15
   ],
   [
    "2024.01",
    "abab 6",
    "2024 年 1 月发布 MoE 文本模型；招股书第 202 页",
    15
   ],
   [
    "2024.04",
    "abab6.5 系列",
    "MoE 架构；200K 上下文",
    0
   ],
   [
    "2025.01",
    "MiniMax-01",
    "Lightning Attention；长上下文",
    1
   ],
   [
    "2025.06",
    "MiniMax-M1",
    "开放混合注意力推理模型",
    2
   ],
   [
    "2025.10",
    "MiniMax M2",
    "聚焦编程与 Agent 工具协作",
    3
   ],
   [
    "2025.12",
    "MiniMax M2.1",
    "官方发布的小版本更新",
    6
   ],
   [
    "2026.02",
    "MiniMax M2.5",
    "官方发布的小版本更新",
    7
   ],
   [
    "2026.03",
    "MiniMax M2.7",
    "复杂软件工程与自主迭代",
    4
   ],
   [
    "2026.06",
    "MiniMax M3",
    "原生多模态；百万上下文",
    5
   ],
   [
    "2026.09",
    "MiniMax M3.1 Flash Preview",
    "官方发布的小版本更新",
    8
   ],
   [
    "2026.10",
    "MiniMax M3.1 Flash",
    "正式版；提升智能体、编程、计算机操作与网络安全能力，推理速度和使用成本进一步优化",
    16,
    "",
    "2026-10-19"
   ]
  ],
  "website": "https://www.minimax.io/"
 },
 {
  "name": "Grok",
  "company": "xAI",
  "color": "#557267",
  "sources": [
   [
    "Grok 首发公告",
    "https://x.ai/news/grok"
   ],
   [
    "Grok-1 开放权重官方仓库",
    "https://github.com/xai-org/grok-1"
   ],
   [
    "Grok-2 Beta 官方发布",
    "https://x.ai/news/grok-2"
   ],
   [
    "Grok 3 Beta 官方发布",
    "https://x.ai/news/grok-3"
   ],
   [
    "Grok 4 官方发布",
    "https://x.ai/news/grok-4"
   ],
   [
    "Grok 4.1 官方发布",
    "https://x.ai/news/grok-4-1"
   ],
   [
    "Grok 4.6 官方发布",
    "https://x.ai/news/grok-4-6"
   ],
   [
    "Grok 1.5 官方记录",
    "https://x.ai/news/grok-1.5"
   ],
   [
    "Grok 1.5 Vision 官方记录",
    "https://x.ai/news/grok-1.5v"
   ],
   [
    "Grok 4.20 官方记录",
    "https://docs.x.ai/developers/release-notes"
   ],
   [
    "Grok 4.3 官方记录",
    "https://docs.x.ai/developers/models/grok-4.3"
   ],
   [
    "Grok 4.5 官方记录",
    "https://docs.x.ai/developers/release-notes"
   ],
   [
    "Grok 4.7 官方记录",
    "https://x.ai/news/grok-4-7"
   ],
   [
    "Grok 4.20 官方模型文档",
    "https://docs.x.ai/developers/models/grok-4.20"
   ],
   [
    "Grok 4.5 · 版本资料",
    "https://x.ai/news/grok-4-5"
   ]
  ],
  "events": [
   [
    "2023.11",
    "Grok-1",
    "接入 X 的实时信息",
    0,
    "p"
   ],
   [
    "2024.03",
    "Grok-1",
    "开放基础模型权重与架构",
    1
   ],
   [
    "2024.03",
    "Grok 1.5",
    "官方发布的小版本更新",
    7
   ],
   [
    "2024.04",
    "Grok 1.5 Vision",
    "官方发布的小版本更新",
    8
   ],
   [
    "2024.08",
    "Grok-2 Beta",
    "通用能力与视觉理解升级",
    2
   ],
   [
    "2025.02",
    "Grok 3 Beta",
    "强化推理；Think 与 DeepSearch",
    3
   ],
   [
    "2025.07",
    "Grok 4",
    "原生工具调用与实时搜索",
    4
   ],
   [
    "2025.11",
    "Grok 4.1",
    "改善对话、创意与情感理解",
    5
   ],
   [
    "2026.03",
    "Grok 4.20",
    "官方发布的小版本更新",
    13
   ],
   [
    "2026.05",
    "Grok 4.3",
    "官方发布的小版本更新",
    10
   ],
   [
    "2026.07",
    "Grok 4.5",
    "官方发布的小版本更新",
    14
   ],
   [
    "2026.08",
    "Grok 4.6",
    "强化编程、工具与工作执行",
    6
   ],
   [
    "2026.09",
    "Grok 4.7",
    "官方发布的小版本更新",
    12
   ]
  ],
  "website": "https://grok.com/"
 },
 {
  "name": "Llama",
  "company": "Meta",
  "color": "#247aa8",
  "sources": [
   [
    "LLaMA 1 发布记录",
    "https://ai.meta.com/research/publications/llama-open-and-efficient-foundation-language-models/"
   ],
   [
    "Llama 2 发布记录",
    "https://github.com/meta-llama/llama-models"
   ],
   [
    "Llama 2 · 版本资料",
    "https://ai.meta.com/blog/llama-2/"
   ],
   [
    "Llama 3 · 版本资料",
    "https://ai.meta.com/blog/meta-llama-3/"
   ],
   [
    "Llama 3.1 · 版本资料",
    "https://ai.meta.com/blog/meta-llama-3-1/"
   ],
   [
    "Llama 3.2 · 版本资料",
    "https://ai.meta.com/blog/llama-3-2-connect-2024-vision-edge-mobile-devices/"
   ],
   [
    "Llama 3.3 · 版本资料",
    "https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct"
   ],
   [
    "Llama 4 Scout / Maverick · 版本资料",
    "https://ai.meta.com/blog/llama-4-multimodal-intelligence/"
   ]
  ],
  "events": [
   [
    "2023.02",
    "LLaMA 1",
    "首次发布 7B—65B 基础模型，向研究社区开放",
    0,
    "",
    "2023-02-24"
   ],
   [
    "2023.07",
    "Llama 2",
    "基础及对话模型，扩展商用许可",
    2,
    "",
    "2023-07-18"
   ],
   [
    "2024.04",
    "Llama 3",
    "8B / 70B 基础及指令模型",
    3,
    "",
    "2024-04-18"
   ],
   [
    "2024.07",
    "Llama 3.1",
    "加入 405B，128K 上下文",
    4,
    "",
    "2024-07-23"
   ],
   [
    "2024.09",
    "Llama 3.2",
    "轻量文本与视觉语言模型",
    5,
    "",
    "2024-09-25"
   ],
   [
    "2024.12",
    "Llama 3.3",
    "70B 指令模型",
    6,
    "",
    "2024-12-04"
   ],
   [
    "2025.04",
    "Llama 4 Scout / Maverick",
    "原生多模态 MoE 模型",
    7,
    "",
    "2025-04-05"
   ]
  ],
  "website": "https://www.llama.com/"
 },
 {
  "name": "Mistral",
  "company": "Mistral AI",
  "color": "#bd7329",
  "sources": [
   [
    "Mistral 7B v0.1 发布记录",
    "https://mistral.ai/news/announcing-mistral-7b/"
   ],
   [
    "Mixtral 8×7B / 7B v0.2 发布记录",
    "https://mistral.ai/news/mixtral-of-experts/"
   ],
   [
    "Mistral 7B v0.2 官方模型卡",
    "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2"
   ],
   [
    "Mistral Large 发布记录",
    "https://docs.mistral.ai/resources/changelogs"
   ],
   [
    "Mistral 7B v0.3 发布记录",
    "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3"
   ],
   [
    "Mistral Large · 版本资料",
    "https://mistral.ai/news/mistral-large/"
   ],
   [
    "Mixtral 8×22B · 版本资料",
    "https://mistral.ai/news/mixtral-8x22b/"
   ],
   [
    "Codestral · 版本资料",
    "https://mistral.ai/news/codestral/"
   ],
   [
    "Mistral NeMo · 版本资料",
    "https://mistral.ai/news/mistral-nemo/"
   ],
   [
    "Mistral Large 2 · 版本资料",
    "https://mistral.ai/news/mistral-large-2407/"
   ],
   [
    "Pixtral 12B / Small 24.09 · 版本资料",
    "https://mistral.ai/news/september-24-release/"
   ],
   [
    "Mistral Large 2.1 / Pixtral Large · 版本资料",
    "https://mistral.ai/news/pixtral-large/"
   ],
   [
    "Mistral Small 3 · 版本资料",
    "https://mistral.ai/news/mistral-small-3/"
   ],
   [
    "Mistral Small 3.1 · 版本资料",
    "https://mistral.ai/news/mistral-small-3-1/"
   ],
   [
    "Mistral Medium 3 · 版本资料",
    "https://mistral.ai/news/mistral-medium-3/"
   ],
   [
    "Devstral Small · 版本资料",
    "https://mistral.ai/news/devstral/"
   ],
   [
    "Magistral Small / Medium · 版本资料",
    "https://mistral.ai/news/magistral/"
   ],
   [
    "Mistral Small 3.2 · 版本资料",
    "https://docs.mistral.ai/models/mistral-small-3-2-25-06"
   ],
   [
    "Devstral Small 1.1 / Medium · 版本资料",
    "https://mistral.ai/news/devstral-2507/"
   ],
   [
    "Magistral 1.1 · 版本资料",
    "https://docs.mistral.ai/models/magistral-medium-1-1-25-07"
   ],
   [
    "Mistral Medium 3.1 · 版本资料",
    "https://docs.mistral.ai/models/mistral-medium-3-1-25-08"
   ],
   [
    "Magistral 1.2 · 版本资料",
    "https://docs.mistral.ai/models/magistral-medium-1-2-25-09"
   ],
   [
    "Mistral Large 3 / Ministral 3 · 版本资料",
    "https://mistral.ai/news/mistral-3/"
   ],
   [
    "Devstral 2 / Small 2 · 版本资料",
    "https://mistral.ai/news/devstral-2-vibe-cli/"
   ],
   [
    "Mistral Small 4 · 版本资料",
    "https://mistral.ai/news/mistral-small-4/"
   ],
   [
    "Mistral Medium 3.5 · 版本资料",
    "https://mistral.ai/news/vibe-remote-agents-mistral-medium-3-5/"
   ],
   [
    "Mistral Large 4 Preview · 版本资料",
    "https://mistral.ai/news/mistral-large-4/"
   ],
   [
    "Mistral Large 4 官方发布",
    "https://mistral.ai/news/mistral-large-4-oss/"
   ]
  ],
  "events": [
   [
    "2023.09",
    "Mistral 7B v0.1",
    "开放权重的 7B Transformer 语言模型",
    0,
    "",
    "2023-09-27"
   ],
   [
    "2023.12",
    "Mixtral 8×7B / 7B v0.2",
    "Mixtral 稀疏 MoE 与 Mistral 7B 指令模型 v0.2 同期发布",
    1,
    "",
    "2023-12-11"
   ],
   [
    "2024.02",
    "Mistral Large",
    "通用旗舰模型与 API",
    5,
    "",
    "2024-02-26"
   ],
   [
    "2024.04",
    "Mixtral 8×22B",
    "更大规模的开放 MoE 模型",
    6,
    "",
    "2024-04-17"
   ],
   [
    "2024.05",
    "Mistral 7B v0.3",
    "词表及工具调用升级",
    4,
    "",
    "2024-05-22"
   ],
   [
    "2024.05",
    "Codestral",
    "代码生成分支首发",
    7,
    "",
    "2024-05-29"
   ],
   [
    "2024.07",
    "Mistral NeMo",
    "12B 通用模型",
    8,
    "",
    "2024-07-18"
   ],
   [
    "2024.07",
    "Mistral Large 2",
    "旗舰模型第二代",
    9,
    "",
    "2024-07-24"
   ],
   [
    "2024.09",
    "Pixtral 12B / Small 24.09",
    "视觉语言与小型通用模型",
    10,
    "",
    "2024-09-17"
   ],
   [
    "2024.11",
    "Mistral Large 2.1 / Pixtral Large",
    "旗舰文本及视觉语言更新",
    11,
    "",
    "2024-11-18"
   ],
   [
    "2025.01",
    "Mistral Small 3",
    "小型通用模型第三代",
    12,
    "",
    "2025-01-30"
   ],
   [
    "2025.03",
    "Mistral Small 3.1",
    "多模态与长上下文",
    13,
    "",
    "2025-03-17"
   ],
   [
    "2025.05",
    "Mistral Medium 3",
    "中型多模态模型",
    14,
    "",
    "2025-05-07"
   ],
   [
    "2025.05",
    "Devstral Small",
    "软件工程 Agent 模型",
    15,
    "",
    "2025-05-21"
   ],
   [
    "2025.06",
    "Magistral Small / Medium",
    "推理模型分支",
    16,
    "",
    "2025-06-10"
   ],
   [
    "2025.06",
    "Mistral Small 3.2",
    "指令遵循与工具调用优化",
    17,
    "",
    "2025-06-20"
   ],
   [
    "2025.07",
    "Devstral Small 1.1 / Medium",
    "编程分支迭代",
    18,
    "",
    "2025-07-10"
   ],
   [
    "2025.07",
    "Magistral 1.1",
    "推理分支迭代",
    19,
    "",
    "2025-07-24"
   ],
   [
    "2025.08",
    "Mistral Medium 3.1",
    "中型模型小版本更新",
    20,
    "",
    "2025-08-12"
   ],
   [
    "2025.09",
    "Magistral 1.2",
    "推理分支小版本更新",
    21,
    "",
    "2025-09-17"
   ],
   [
    "2025.12",
    "Mistral Large 3 / Ministral 3",
    "大型 MoE 与轻量模型家族",
    22,
    "",
    "2025-12-02"
   ],
   [
    "2025.12",
    "Devstral 2 / Small 2",
    "软件工程模型第二代",
    23,
    "",
    "2025-12-09"
   ],
   [
    "2026.03",
    "Mistral Small 4",
    "统一指令、推理及编程",
    24,
    "",
    "2026-03-16"
   ],
   [
    "2026.04",
    "Mistral Medium 3.5",
    "多模态、Agent 与编程能力升级",
    25,
    "",
    "2026-04-28"
   ],
   [
    "2026.10",
    "Mistral Large 4 Preview",
    "旗舰多模态模型公开预览",
    26,
    "",
    "2026-10-06"
   ],
   [
    "2026.10",
    "Mistral Large 4",
    "发布改进后的开放权重版；提升编程、防御性网络安全与推理效率，支持三档推理模式",
    27,
    "",
    "2026-10-29"
   ]
  ],
  "website": "https://mistral.ai/"
 },
 {
  "name": "Kimi",
  "company": "月之暗面 · Moonshot AI",
  "color": "#2855a1",
  "sources": [
   [
    "Moonshot v1 / Kimi Chat 发布记录",
    "https://spap.jst.go.jp/investigation/downloads/2024_rr_06_en.pdf"
   ],
   [
    "Kimi k1.5 发布记录",
    "https://github.com/MoonshotAI/Kimi-k1.5"
   ],
   [
    "Kimi-VL 发布记录",
    "https://www.kimi.ai/blog/kimi-vl"
   ],
   [
    "Kimi-Dev 发布记录",
    "https://www.kimi.ai/blog/kimi-dev"
   ],
   [
    "Kimi K2 发布记录",
    "https://www.kimi.ai/blog/kimi-k2"
   ],
   [
    "Kimi K2 Thinking 发布记录",
    "https://www.kimi.ai/blog/kimi-k2-thinking"
   ],
   [
    "Kimi K2.5 发布记录",
    "https://www.kimi.ai/blog/kimi-k2-5"
   ],
   [
    "Kimi K2.6 发布记录",
    "https://www.kimi.ai/blog/kimi-k2-6"
   ],
   [
    "Kimi K2.7 Code 发布记录",
    "https://huggingface.co/moonshotai/Kimi-K2.7-Code"
   ],
   [
    "Kimi K3 发布记录",
    "https://www.kimi.ai/blog/kimi-k3"
   ],
   [
    "Moonshot v1 / Kimi Chat · 版本资料",
    "https://spap.jst.go.jp/investigation/downloads/2024_rr_06_en.pdf#page=56"
   ],
   [
    "Kimi-VL · 版本资料",
    "https://github.com/MoonshotAI/Kimi-VL"
   ],
   [
    "Kimi-Dev · 版本资料",
    "https://github.com/MoonshotAI/Kimi-Dev"
   ],
   [
    "Kimi K3.1 Pro / Highspeed 官方发布",
    "https://www.kimi.ai/blog/kimi-k3-1-pro"
   ],
   [
    "K3.1 Pro 系列上线日期与高速版说明",
    "https://www.kimi.com/code/docs/kimi-code/whats-new.html"
   ]
  ],
  "events": [
   [
    "2023.10",
    "Moonshot v1 / Kimi Chat",
    "早期 Kimi 产品及 Moonshot v1 模型；长上下文对话",
    10
   ],
   [
    "2025.01",
    "Kimi k1.5",
    "多模态强化学习推理模型",
    1,
    "",
    "2025-01-20"
   ],
   [
    "2025.04",
    "Kimi-VL",
    "视觉语言模型",
    11,
    "",
    "2025-04-10"
   ],
   [
    "2025.06",
    "Kimi-Dev",
    "软件工程模型",
    12,
    "",
    "2025-06-17"
   ],
   [
    "2025.07",
    "Kimi K2",
    "开放 MoE 模型；Agent 与代码能力",
    4,
    "",
    "2025-07-11"
   ],
   [
    "2025.11",
    "Kimi K2 Thinking",
    "强化工具调用与长程推理",
    5,
    "",
    "2025-11-06"
   ],
   [
    "2026.01",
    "Kimi K2.5",
    "原生视觉与 Agent 协作",
    6,
    "",
    "2026-01-27"
   ],
   [
    "2026.04",
    "Kimi K2.6",
    "长程编程与 Agent 任务升级",
    7,
    "",
    "2026-04-20"
   ],
   [
    "2026.06",
    "Kimi K2.7 Code",
    "面向长程软件工程的编程分支；发布时间按月记录",
    8
   ],
   [
    "2026.07",
    "Kimi K3",
    "新一代开放权重旗舰模型",
    9,
    "",
    "2026-07-16"
   ],
   [
    "2026.10",
    "Kimi K3.1 Pro / Highspeed",
    "三万亿级参数、百万上下文；提升编程、3D 创作、金融研究与长程智能体能力；同日推出 Highspeed 高速版",
    13,
    "",
    "2026-10-23"
   ]
  ],
  "website": "https://www.kimi.ai/"
 },
 {
  "name": "文心 ERNIE",
  "company": "百度",
  "color": "#6b9ed6",
  "sources": [
   [
    "ERNIE 1.0 发布记录",
    "https://cloud.baidu.com/news/news_baaf79a3-2cdf-47d8-a53a-63ab70063f97"
   ],
   [
    "ERNIE 2.0 发布记录",
    "https://arxiv.org/abs/1907.12412"
   ],
   [
    "ERNIE 3.0 发布记录",
    "https://arxiv.org/abs/2107.02137"
   ],
   [
    "ERNIE Bot 发布记录",
    "https://agents.baidu.com/docs/develop/model/ERNIE_bot_introduce/"
   ],
   [
    "ERNIE 3.5 发布记录",
    "https://www.sec.gov/Archives/edgar/data/1329099/000119312526109289/d38065d20f.htm"
   ],
   [
    "ERNIE 4.0 发布记录",
    "https://ir.baidu.com/static-files/cd96c440-1fbc-4346-9d47-4248b2ef77c0"
   ],
   [
    "ERNIE 4.5 / X1 发布记录",
    "https://cloud.baidu.com/product/model.html"
   ],
   [
    "ERNIE X1.1 发布记录",
    "https://home.baidu.com/home/index/news_detail/id/18038"
   ],
   [
    "ERNIE 5.0 Preview 发布记录",
    "https://www.prnewswire.com/news-releases/baidu-unveils-ernie-5-0-and-a-series-of-ai-applications-at-baidu-world-2025--ramps-up-global-push-302614531.html"
   ],
   [
    "ERNIE 5.1 Preview 发布记录",
    "https://ernie.baidu.com/blog/zh/"
   ],
   [
    "ERNIE 5.1 发布记录",
    "https://ernie.baidu.com/blog/posts/ernie-5.1-0508-release/"
   ],
   [
    "2026 年 1 月 ERNIE 5.0 更新（百度官方公告）",
    "https://www1.hkexnews.hk/listedco/listconews/sehk/2026/0226/2026022600493.pdf"
   ],
   [
    "ERNIE 1.0 · 版本资料",
    "https://arxiv.org/abs/1904.09223"
   ],
   [
    "ERNIE 3.5 · 版本资料",
    "https://ai.baidu.com/ai-doc/WENXINWORKSHOP/jlil56u11"
   ],
   [
    "ERNIE 4.0 · 版本资料",
    "https://www.prnewswire.com/news-releases/baidu-launches-ernie-4-0-foundation-model-leading-a-new-wave-of-ai-native-applications-301958681.html"
   ],
   [
    "ERNIE 4.5 / X1 · 版本资料",
    "https://en.prnasia.com/releases/global/baidu-unveils-ernie-4-5-and-reasoning-model-ernie-x1-makes-ernie-bot-free-ahead-of-schedule-481782.shtml"
   ],
   [
    "ERNIE 5.0 · 版本资料",
    "https://ernie.baidu.com/blog/zh/posts/ernie5.0/"
   ],
   [
    "ERNIE 5.1 Preview · 版本资料",
    "https://ernie.baidu.com/blog/zh/posts/ernie-5.1-preview-0430-release-on-lmarena/"
   ]
  ],
  "events": [
   [
    "2019.03",
    "ERNIE 1.0",
    "早期 Transformer 预训练模型；知识增强与实体掩码",
    12
   ],
   [
    "2019.07",
    "ERNIE 2.0",
    "持续学习的多任务预训练框架",
    1,
    "",
    "2019-07-29"
   ],
   [
    "2021.07",
    "ERNIE 3.0",
    "知识增强的大规模语言理解与生成",
    2,
    "",
    "2021-07-05"
   ],
   [
    "2021.12",
    "ERNIE 3.0 Titan",
    "鹏城实验室与百度联合发布千亿模型",
    0,
    "",
    "2021-12-08"
   ],
   [
    "2023.03",
    "ERNIE Bot",
    "文心一言对话产品发布，基于 ERNIE 系列",
    3,
    "",
    "2023-03-16"
   ],
   [
    "2023.05",
    "ERNIE 3.5",
    "官方年报记载于 2023 年 5 月推出",
    13
   ],
   [
    "2023.10",
    "ERNIE 4.0",
    "理解、生成、逻辑与记忆能力升级",
    14,
    "",
    "2023-10-17"
   ],
   [
    "2025.03",
    "ERNIE 4.5 / X1",
    "原生多模态旗舰与深度推理分支",
    15,
    "",
    "2025-03-16"
   ],
   [
    "2025.09",
    "ERNIE X1.1",
    "推理分支升级，增强事实性、指令遵循及 Agent 能力",
    7,
    "",
    "2025-09-09"
   ],
   [
    "2025.11",
    "ERNIE 5.0 Preview",
    "百度世界大会公布原生全模态新一代模型",
    8,
    "",
    "2025-11-13"
   ],
   [
    "2026.01",
    "ERNIE 5.0",
    "2026 年 1 月推出更新版原生全模态模型；官方公告按月记载",
    16
   ],
   [
    "2026.04",
    "ERNIE 5.1 Preview",
    "官方公布 5.1 预览版的竞技场记录",
    17,
    "",
    "2026-04-30"
   ],
   [
    "2026.05",
    "ERNIE 5.1",
    "5.1 正式版发布，提升 Agent、推理与创作能力",
    10,
    "",
    "2026-05-09"
   ]
  ],
  "website": "https://ernie.baidu.com/"
 },
 {
  "name": "混元 Hunyuan",
  "company": "腾讯",
  "color": "#328f9d",
  "sources": [
   [
    "HunYuan-NLP 1T 发布记录",
    "https://developer.cloud.tencent.com/article/2189454"
   ],
   [
    "Hunyuan 发布记录",
    "https://www.tencent.com/tencent-unveils-hunyuan-its-proprietary-large-foundation-model-on-tencent-cloud/"
   ],
   [
    "Hunyuan Turbo 发布记录",
    "https://www.tencent.com/tencent-unveils-new-ai-upgrades-proprietary-innovations-and-global-solutions/"
   ],
   [
    "Hunyuan Large 发布记录",
    "https://arxiv.org/abs/2411.02265"
   ],
   [
    "Hunyuan T1 Preview 发布记录",
    "https://static.www.tencent.com/uploads/2025/09/16/5a0b274dacf222d262734936c3508821.pdf"
   ],
   [
    "Hunyuan TurboS 发布记录",
    "https://cloud.tencent.cn/document/product/1729/97765"
   ],
   [
    "Hy3 Preview 发布记录",
    "https://hunyuan.tencent.com/model/hy-model"
   ],
   [
    "Hy3 发布记录",
    "https://hunyuan.tencent.com/research/hy3?langVersion=zh"
   ],
   [
    "Hy4 Preview 发布记录",
    "https://www.tencent.com/tencent-releases-and-open-sources-tencent-hy4-preview/"
   ],
   [
    "Hunyuan T1 Preview · 版本资料",
    "https://github.com/Tencent/llm.hunyuan.T1#:~:text=T1-Preview"
   ],
   [
    "Hunyuan TurboS · 版本资料",
    "https://arxiv.org/abs/2505.15431"
   ],
   [
    "Hunyuan T1 · 版本资料",
    "https://github.com/Tencent/llm.hunyuan.T1"
   ],
   [
    "Hunyuan TurboS Vision 1.1 · 版本资料",
    "https://cloud.tencent.cn/document/product/1729/97765#ecb8371e-ae02-4c54-b536-6287351ca822:~:text=hunyuan-turbos-vision-v1.1"
   ],
   [
    "Hunyuan A13B · 版本资料",
    "https://github.com/Tencent-Hunyuan/Hunyuan-A13B"
   ],
   [
    "HY 2.0 Think · 版本资料",
    "https://cloud.tencent.cn/document/product/1729/97765#e3487708-0ef6-4f1a-8ffc-cc6f65b72563:~:text=Tencent%20HY%202.0%20Think"
   ],
   [
    "HY 2.0 Instruct · 版本资料",
    "https://cloud.tencent.cn/document/product/1729/97765#e3487708-0ef6-4f1a-8ffc-cc6f65b72563:~:text=Tencent%20HY%202.0%20Instruct"
   ],
   [
    "HY Vision 1.5 Instruct · 版本资料",
    "https://github.com/Tencent-Hunyuan/HunyuanVision"
   ],
   [
    "Hy3 Preview · 版本资料",
    "https://github.com/Tencent-Hunyuan/Hy3-preview"
   ]
  ],
  "events": [
   [
    "2022.11",
    "HunYuan-NLP 1T",
    "早期万亿参数 MoE 预训练语言模型，已用于内部业务",
    0
   ],
   [
    "2023.09",
    "Hunyuan",
    "经腾讯云开放企业 API",
    1,
    "",
    "2023-09-07"
   ],
   [
    "2024.09",
    "Hunyuan Turbo",
    "异构 MoE 架构",
    2,
    "",
    "2024-09-05"
   ],
   [
    "2024.11",
    "Hunyuan Large",
    "开放 MoE 大型语言模型研究发布",
    3,
    "",
    "2024-11-05"
   ],
   [
    "2025.02",
    "Hunyuan T1 Preview",
    "官方投资者报告记载的早期深度思考模型",
    9
   ],
   [
    "2025.02",
    "Hunyuan TurboS",
    "高效率通用快思考模型",
    10,
    "",
    "2025-02-27"
   ],
   [
    "2025.03",
    "Hunyuan T1",
    "深度思考模型正式版",
    11,
    "",
    "2025-03-21"
   ],
   [
    "2025.05",
    "Hunyuan TurboS Vision 1.1",
    "视觉语言分支 v1.1",
    12,
    "",
    "2025-05-23"
   ],
   [
    "2025.06",
    "Hunyuan A13B",
    "混合推理 MoE，支持快慢思考切换",
    13,
    "",
    "2025-06-25"
   ],
   [
    "2025.11",
    "HY 2.0 Think",
    "混元 2.0 推理分支",
    14,
    "",
    "2025-11-09"
   ],
   [
    "2025.11",
    "HY 2.0 Instruct",
    "混元 2.0 指令分支",
    15,
    "",
    "2025-11-11"
   ],
   [
    "2025.12",
    "HY Vision 1.5 Instruct",
    "视觉语言分支 1.5",
    16,
    "",
    "2025-12-17"
   ],
   [
    "2026.04",
    "Hy3 Preview",
    "面向实际 Agent 任务的开放预览模型",
    17,
    "",
    "2026-04-24"
   ],
   [
    "2026.07",
    "Hy3",
    "正式版，强化办公与 Agent 任务",
    7,
    "",
    "2026-07-06"
   ],
   [
    "2026.08",
    "Hy4 Preview",
    "新一代开放权重 MoE 旗舰预览",
    8,
    "",
    "2026-08-28"
   ]
  ],
  "website": "https://hunyuan.tencent.com/"
 },
 {
  "name": "Step",
  "company": "阶跃星辰 · StepFun",
  "color": "#897142",
  "sources": [
   [
    "2024 年 Step 系列发布历史（量子位智库研究报告）",
    "https://pdf.dfcfw.com/pdf/H3_AP202410071640177318_1.pdf"
   ],
   [
    "Step-3 发布记录",
    "https://arxiv.org/abs/2507.19427"
   ],
   [
    "Step 3.5 Flash 发布记录",
    "https://www.stepfun.com/news"
   ],
   [
    "Step 3.7 Flash 发布记录",
    "https://static.stepfun.com/blog/step-3.7-flash/"
   ],
   [
    "Step 5 Preview 发布记录",
    "https://www.stepfun.com/step-5-preview"
   ],
   [
    "2024 全球开发者先锋大会发布现场记录",
    "https://www.qbitai.com/2024/03/130184.html"
   ],
   [
    "Step-1 / Step-1V · 版本资料",
    "https://pdf.dfcfw.com/pdf/H3_AP202410071640177318_1.pdf#page=22"
   ],
   [
    "Step 3.5 Flash · 版本资料",
    "https://static.stepfun.com/blog/step-3.5-flash/"
   ]
  ],
  "events": [
   [
    "2024.03",
    "Step-1 / Step-1V",
    "通用语言与视觉语言首发；同场公布 Step-2 预览版",
    6,
    "",
    "2024-03-23"
   ],
   [
    "2024.07",
    "Step-2 / Step-1.5V",
    "Step-2 正式版与视觉语言分支 1.5V 同期发布",
    6,
    "",
    "2024-07-04"
   ],
   [
    "2025.07",
    "Step-3",
    "多模态 MoE；以技术报告公开日期为研究发布节点",
    1,
    "",
    "2025-07-25"
   ],
   [
    "2026.02",
    "Step 3.5 Flash",
    "面向 Agent 的开放权重推理模型",
    7,
    "",
    "2026-02-02"
   ],
   [
    "2026.05",
    "Step 3.7 Flash",
    "高效率多模态与 Agent 模型",
    3,
    "",
    "2026-05-29"
   ],
   [
    "2026.09",
    "Step 5 Preview",
    "旗舰 MoE 预览，面向软件工程与专业任务",
    4,
    "",
    "2026-09-20"
   ]
  ],
  "website": "https://www.stepfun.com/"
 }
];
