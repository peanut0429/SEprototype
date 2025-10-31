# 核心流程（文字/ASCII 示意）

## 首次引导
1. `#/onboarding` 选择角色（家长/学生/游客），添加孩子信息（姓名/年级/每日目标=30题）
2. 跳转 `#/generator`（首次），默认一键生成 30 题（屏幕练习）
3. 返回家长首页 `#/parent-home` 可见今日任务卡片
4. 学生进入 `#/child-home` 点击“开始练习”到 `#/practice`
5. 提交后到 `#/result`，可进入 `#/mistakes` 只练错题

```
Onboarding -> Generator -> Parent Home -> Child Home -> Practice -> Result -> Mistakes
```

## 日常练习
1. `#/child-home` 进入今日任务
2. `#/practice` 完成 30 题（数字键盘 / 键盘提交 / 跳题）
3. `#/result` 查看成绩；可“再做一套”或“只练错题”
4. 完成后进入 `#/rewards`（占位）

## 打印与批改
1. `#/generator` 生成套题 -> `#/print-center` 预览（两栏/三栏、答案开关）
2. 线下完成；`#/review-ocr` 上传拍照（占位识别）
3. 同步结果与错题 -> `#/result`

## 状态切换
- 每页具备 `loading | empty | error | offline` 四种状态（通过 `[data-state]` 控制视图）
- 离线：监听 `online/offline` 自动切换并提示 Toast
