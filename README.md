# 小学口算练习 · 低保真交互原型

一个采用原生 HTML/CSS/JavaScript 实现的移动优先原型，用于验证“小学口算练习应用”的核心流程与交互。项目为纯静态站点，使用 Hash 路由，无后端依赖；数据持久化存储在浏览器 localStorage。

> 注意：默认首页为“登录页”，请通过本地静态服务器访问本原型，直接以 file:// 打开会因浏览器策略导致页面片段与数据加载失败。

## 功能亮点

- 登录/注册（独立页面），登录为默认入口
- 学生首页：快速开始练习、错题快练、打卡迷你日历、今日奖励预告
- 日历打卡：月视图、今日打卡、连续天数与周完成统计
- 出题与练习：一键生成当日套题、题目练习流程、结果统计
- 错题本：汇总与快速生成“只练错题”套题
- 题库设置：每日目标题数、是否优先弱项/预热题，直接影响出题比例
- 我的：统一管理账号与个人资料
  - 登录名、角色、修改密码（原型）
  - 学生资料（姓名、年级、每日目标）或家长资料（姓名、电话、邮箱）
  - 后端 API 占位（Base URL / Token，支持本地模拟）
- 家长童锁（可选）：PIN 上锁，解锁 5 分钟有效
- 打印中心：题目预览，两/三栏切换，显示/隐藏答案，打印友好
- 易用性：移动端优先、键盘与读屏友好（focus-visible、高对比度模式）

## 目录结构（关键）

```
se/
  prototype/
    index.html            # 应用入口
    assets/
      app.js              # 路由、状态与页面初始化（核心逻辑）
      styles.css          # 全局样式
      components.css      # 组件样式（含日历等）
      tokens.css          # 设计令牌（颜色、字号等）
      mock-data.json      # 示例数据
      icons/              # 图标资源
    pages/
      auth-login.html     # 登录
      auth-register.html  # 注册
      onboarding.html     # 引导（已简化：仅入口链接）
      child-home.html     # 学生首页
      parent-home.html    # 家长首页（需童锁）
      generator.html      # 出题器
      practice.html       # 练习
      result.html         # 练习结果
      mistakes.html       # 错题本
      calendar.html       # 日历打卡（整月）
      study-settings.html # 题库设置（学习板块）
      my.html             # 我的（账号与个人资料）
      print-center.html   # 打印中心
      reports.html        # 报告中心（家长区，占位）
      review-ocr.html     # 批改中心（占位）
      settings.html       # 设置（高对比度、家长童锁、清除数据）
      notifications.html  # 通知（占位）
```

## 本地运行

推荐使用 VS Code 的 Live Server 插件，或任意静态服务器。以下命令为可选示例：

- 使用 Node（npx）：

```powershell
npx http-server . -p 8080 -c-1
# 打开 http://localhost:8080/prototype/
```

- 使用 PowerShell 简易服务器（针对新 Windows 可能不可用）：

```powershell
# 若已安装 IIS Express 等工具，可改用对应方式
```

> 直接双击打开 index.html（file://）会触发浏览器安全限制，导致页面片段与 mock 数据无法通过 fetch 读取。

## 路由与导航

- 路由方式：Hash（location.hash）
- 默认首页：`#/auth-login`
- 典型路径：
  - 登录：`#/auth-login`；注册：`#/auth-register`
  - 学生首页：`#/child-home`
  - 家长首页（受童锁保护）：`#/parent-home`
  - 日历打卡：`#/calendar`
  - 题库设置：`#/study-settings`
  - 我的：`#/my`
  - 打印中心：`#/print-center`

未登录状态会隐藏底部导航；登录成功后按角色显示不同的 Tab。

## 数据与持久化

- 存储键：`se-prototype`
- 关键数据：children、questionBank、dailySets、results、mistakes、rewards、notifications、checkins、account、api、parentProfile、settings、parentLock 等
- 出题策略：
  - 默认使用“每日目标题数”（学生个人设置）
  - 按偏好计算比例：弱项 30%（可关）、预热 10%（可关）、其余为常规题
- 清除数据：在“设置”页点击“清除本地数据”并刷新即可复位

## 可访问性与适配

- 移动优先布局，大尺寸触控目标
- 键盘操作友好：输入框与按钮的焦点可见（:focus-visible）
- 高对比度模式：设置页可切换（会即时生效并持久化）

## 打印与导出

- 打印中心（`#/print-center`）提供预览，支持：
  - 两栏/三栏切换
  - 显示/隐藏答案
  - 浏览器原生“打印”输出

## 常见问题（FAQ）

- Q：直接打开 index.html 显示“加载失败”？
  - A：请使用本地静态服务器（如 VS Code Live Server，或 `npx http-server`），不要以 file:// 方式打开。
- Q：默认账号是什么？
  - A：无默认账号。请先注册再登录；本原型仅在本地保存账号信息。
- Q：无法访问家长页面？
  - A：启用家长童锁后需输入 PIN；解锁 5 分钟内有效，超时需重新输入。

## 开发指南

- 主要逻辑集中在 `prototype/assets/app.js`：
  - 路由表、页面初始化（initXxx）、状态管理与持久化
  - 出题生成 `generateDailySet()`、日历/打卡、支付/打印占位等
- UI 片段位于 `prototype/pages/`；纯 HTML，可直接增删改
- 样式位于 `prototype/assets/styles.css` 与 `components.css`；设计令牌在 `tokens.css`
- 图标在 `prototype/assets/icons/`

> 提示：若要迭代题型或策略，建议先扩展 `questionBank` 的题型/标签，再在 `generateDailySet()` 中按标签与比例组装。

## 版本与声明

- 本项目仅用于演示/教学原型，非生产可用版本
- 代码与素材如涉及第三方资源，请在实际商用前替换或确认许可
