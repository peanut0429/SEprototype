# 无障碍与可触达清单

- 焦点可见：`:focus-visible` 自定义高对比描边
- 触控尺寸：按钮/键盘最小高度 ≥ 44px
- 文本对比：遵循 WCAG AA（4.5:1），令牌色彩可在暗色模式调优
- 屏幕阅读器友好：
  - 题干 `aria-live="polite"`；Toast `role="status"`；主要区域 `role="main"`
  - 表单控件具备 `<label for>` 或 `aria-label`
  - 跳过链接：`.skip-link`
- 键盘操作：
  - 数字输入：0-9；退格：Backspace；提交：Enter
  - Tab 导航遍历交互元素
- 离线/错误提示：全局监听 online/offline，视图切换并提示
- 打印：`@media print` 隐藏导航与交互，仅保留内容
