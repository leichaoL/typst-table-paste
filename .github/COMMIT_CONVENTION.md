# Commit Message 规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

## 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type（必需）

- **feat**: 新功能
- **fix**: Bug 修复
- **docs**: 文档更新
- **style**: 代码格式调整（不影响功能）
- **refactor**: 重构（既不是新功能也不是 bug 修复）
- **perf**: 性能优化
- **test**: 测试相关
- **chore**: 构建过程或辅助工具的变动
- **ci**: CI/CD 配置文件和脚本的变动
- **release**: 版本发布

### Scope（可选）

指定影响的范围，例如：
- `parser`: 解析器相关
- `converter`: 转换器相关
- `rtf`: RTF 相关
- `excel`: Excel 相关
- `csv`: CSV 相关
- `ui`: 用户界面
- `workflow`: GitHub Actions

### Subject（必需）

- 使用祈使句，现在时态："添加"而不是"添加了"
- 不要大写首字母
- 结尾不加句号
- 简洁明了，不超过 50 个字符

### Body（可选）

- 详细描述改动的原因和内容
- 可以分多行
- 每行不超过 72 个字符

### Footer（可选）

- 关闭 issue：`Closes #123`
- 破坏性变更：`BREAKING CHANGE: 描述`

## 示例

### 新功能
```
feat(rtf): 支持 Word RTF 格式表格导入

- 添加 Word RTF 格式解析逻辑
- 支持复杂的 \irow 分组结构
- 处理纯文本数字单元格
```

### Bug 修复
```
fix(parser): 修复 CSV 文件标题提取失败的问题

CSV 文件无法自动使用文件名作为表格标题。
现在正确提取文件名并转义特殊字符。

Closes #42
```

### 文档更新
```
docs: 更新 README 中的 RTF 导入说明

添加 RTF 转换限制的警告信息。
```

### 版本发布
```
release: v0.7.0

### 新增
- RTF 表格导入支持

### 修复
- CSV 文件标题提取
- Panel 标题转义
```

### CI/CD 相关
```
ci: 添加 GitHub Actions 权限配置

添加 contents: write 权限以允许创建 release。
```

## 工具

可以使用 [commitizen](https://github.com/commitizen/cz-cli) 来辅助生成规范的 commit message：

```bash
npm install -g commitizen
commitizen init cz-conventional-changelog --save-dev --save-exact
```

然后使用 `git cz` 代替 `git commit`。

## 参考

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
