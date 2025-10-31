# 组件清单与规范（低保真）

## QuestionItem（题卡）
- 结构：`.question-card` + `.question-stem` + 输入区 + 进度条
- 状态：默认/正确/错误/未作（错误/正确可通过样式类区分）
- 无障碍：题干 `aria-live="polite"`，输入框有 `label`

## Numpad（数字键盘）
- 结构：`.numpad` 网格 + `.numpad-btn`
- 键位：0-9、`del` 退格、`ok` 提交；长按删除可后续增强
- 键盘等效：物理键 0-9、Backspace、Enter

## StatsCard（统计卡）
- `.stats` 容器 + `.stats-card` 项；`.stats-value` `.stats-sub`
- 指标：正确率、用时、对/总；可扩展趋势

## FilterBar（过滤条）
- `.filter-bar` + `.filter-chip(.active)`
- 用于错题本筛选（知识点/日期/难度）

## PreviewGrid（打印预览）
- `.preview-grid{ --cols:2|3 }` 控制两/三栏
- `.preview-item` 单题，打印时字体/间距调整

## EmptyState（空状态）
- `.empty` + `.empty-icon`
- 文案简短：无数据/暂无错题/暂无报告

## Skeleton（骨架）
- `.skeleton` 基类 + `.skeleton-line`
- 页面级 `.skeleton-page`

## Toast/Notice（提示）
- `.toast` 全局浮层提示；`.notice(.success|.error)` 行内提示

## Nav（导航）
- 顶部：返回/设置按钮；底部：`.app-tabbar .tab-item`

## 设计令牌（tokens.css）
- 颜色（brand/accent/success/danger/bg/text）
- 字号（xs-sm-base-md-lg-xl-xxl），间距（sp-1..8），圆角 & 阴影
