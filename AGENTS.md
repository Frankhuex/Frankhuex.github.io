# 网站更新约定

## 新增歌曲或程序

- 新增歌曲时，将新曲放到音乐区的 featured 位置，原 featured 顺延到普通列表首位，保留其封面、链接和曲风等信息。
- 更新 featured 歌曲时，还要同步更新 `NewHome/script.js` 中 `setupFloatingCovers()` 的 `covers` 数组内手动维护的 featured 项（歌曲名和封面路径），确保新曲进入首页封面弹球的随机候选池。普通歌曲通过 `...musicItems` 自动合并；旧 featured 移入 `musicItems` 后会继续保留在候选池中，无需重复添加。
- 新增程序、游戏或工具时，将新项目放到程序区的 featured（`project-showcase`）位置，原有推荐项目依次后移，挤出的最后一项移到对应的普通列表首位，保留原有信息和访问入口。
- 同步检查根目录 `index.html`、`NewHome/index.html` 和共用的 `NewHome/script.js`，确保两个首页入口一致；图片路径应适配各自目录。

## 新网站的 Cloudflare 埋点

- 每次新增网站或独立页面，都要在 HTML 的 head 区域加入 Cloudflare Web Analytics 埋点，并检查每个页面仅加载一次。
- 沿用现有首页的脚本和 `data-cf-beacon` 配置；当前脚本地址为 `https://static.cloudflareinsights.com/beacon.min.js`，token 为 `dc0311d6f7ef4c5092635a749c89f8df`。若配置已有更新，以根目录 `index.html` 的现有配置为准。
- 可参考 `QSpring/index.html` 或 `SpectrumStudio/index.html` 的接入方式，更新完成后核对脚本地址、配置和重复加载情况。
