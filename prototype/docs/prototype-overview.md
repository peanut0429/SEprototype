# 小学口算练习 · 低保真原型（可试用/可打印）

快速预览（本地任一静态环境均可）：
- 直接双击 `se/prototype/index.html` 打开浏览器预览，或
- 使用 VS Code 扩展 Live Server 在该文件上“Open with Live Server”。

本原型为移动端优先（375×667），兼容平板与桌面，覆盖家长与学生的核心流程，支持打印样式与简易批改占位。无需构建与依赖，纯原生 HTML/CSS/JS。

## 信息架构（IA）
- 入口 `index.html`（顶部返回/更多、底部标签导航）
- 核心路由（hash）：
  - `#/onboarding` 首次引导（角色、添加孩子、目标）
  - `#/parent-home` 家长首页（今日任务、一键出题、快捷入口）
  - `#/child-home` 学生首页（今日任务、错题快练）
  - `#/generator` 出题器（一键30题、自定义参数、打印开关）
  - `#/practice` 练习页（题干/键盘/计时占位）
  - `#/result` 结果（成绩/错题）
  - `#/mistakes` 错题本（筛选/一键生成错题巩固30题）
  - `#/print-center` 打印中心（A4 预览，两栏/三栏，答案开关）
  - `#/review-ocr` 批改中心（拍照上传占位、识别完成提示）
  - `#/reports` 报告中心（日报/周报/月报占位）
  - `#/calendar` 打卡日历（完成/未完成、连续天数）
  - `#/settings` 设置（语音/计时/清除本地数据）
  - `#/notifications` 提醒与通知
  - `#/rewards` 奖励中心（徽章墙/等级占位）
  - `#/help` 帮助/反馈

## 导航与状态图（ASCII）
```
[Onboarding] --添加孩子/选择角色--> [Generator] --一键生成--> [Parent Home]
     |                                                 |
     v                                                 v
[Child Home] --开始练习--> [Practice] --提交--> [Result] --只练错题--> [Mistakes]
     |                                                 
     +-- 错题快练 ------------------------------------^

[Generator] --打印开关--> [Print Center] --线下完成--> [Review OCR] --同步--> [Result]

全局：底部标签 <家长|学生|报告|设置> 互通；顶部返回
```

## 文件结构（关键）
- `assets/tokens.css` 设计令牌（颜色/字号/间距/圆角/阴影）
- `assets/styles.css` 基础样式与布局、状态（loading/empty/error/offline）
- `assets/components.css` 复用组件（题卡/数字键盘/统计卡/过滤条/预览网格/空状态/骨架/Toast/导航）
- `assets/app.js` 轻量 Hash Router、页面装载（fetch pages/*.html）、mock 数据与核心交互
- `assets/mock-data.json` 演示数据（孩子/题库/每日套题/结果/错题/奖励/通知）
- `pages/*.html` 各页面骨架（含主态/空态/加载态/错误态/离线态）
- `docs/*` 说明文档（本文件、流程、组件、可达性、发布记录）

## 本地数据与试用
- 首次打开在 `#/onboarding`，可添加孩子（默认每日 30 题）；生成套题后即可开始练习
- 数据保存在 `localStorage` 键 `se-prototype`，可在设置页“清除本地数据”重置

## 兼容与约定
- 复用原设计文档中的用词与风格（如主色 #4A90E2、按钮与卡片风格）
- 移动优先 + 简易响应式（768/1200 断点），无水平滚动
- 无依赖、可直接托管到 GitHub Pages/Vercel（静态托管）
