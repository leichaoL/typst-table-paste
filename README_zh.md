# Typst Table Paste

[![Version](https://img.shields.io/visual-studio-marketplace/v/leichaoL.typst-table-paste)](https://marketplace.visualstudio.com/items?itemName=leichaoL.typst-table-paste)
[![License](https://img.shields.io/github/license/leichaoL/typst-table-paste)](https://github.com/leichaoL/typst-table-paste/blob/main/LICENSE)

[English](README.md) | 简体中文

一个 VSCode 扩展，可以自动将剪贴板中的 RTF 或 CSV 表格转换为 Typst 表格语法。

## 功能特性

- ✅ **自动转换**：粘贴时自动检测并转换表格格式
- ✅ **多格式支持**：
  - RTF 表格（从 Word、Excel 复制）
  - CSV 表格（标准逗号分隔和等号分隔格式）
  - 从整个文档内容中提取表格
- ✅ **格式保留**：
  - 显著性标记（`***`、`**`、`*`）转换为 Typst 上标语法
  - 表格边框样式（顶线、底线等）
  - 学术论文三线表格式
  - 对齐方式（左对齐、居中、右对齐）
  - 自动列宽设置
- ✅ **智能格式化**：
  - 小表格（≤ 5 列）：所有单元格在一行，行间有空行
  - 大表格（> 5 列）：每个单元格单独一行，行间有两个空行
  - 自动将变量名和 R² 转换为数学模式（可选）
- ✅ **文件管理**：
  - 表格保存到 `typ_tables/` 文件夹中的单独文件
  - 自动文件命名（`table_001.typ`、`table_002.typ`...）
  - 在粘贴位置插入引用代码
  - 支持一次粘贴多个表格

## 安装

### 从源码安装

1. 克隆或下载本项目
2. 在项目目录中运行：
   ```bash
   npm install
   npm run compile
   ```
3. 在 VSCode 中按 `F5` 启动调试模式

### 从市场安装（即将推出）

在 VSCode 扩展市场中搜索 "Typst Table Paste"。

## 使用方法

### 键盘快捷键（推荐）

1. 从 Excel、Word 或其他应用程序复制表格
2. 在 Typst 文件（`.typ`）中，按 `Ctrl+Shift+V`（或 `Cmd+Shift+V`）粘贴
3. 扩展将自动检测并转换为 Typst 表格语法
4. 表格将保存到 `typ_tables/` 文件夹，并在当前位置插入引用

**注意**：使用 `Ctrl+Shift+V` 而不是 `Ctrl+V`，以避免与其他粘贴扩展（如 typst-figure-pastetools）冲突。

### 手动转换

1. 将表格复制到剪贴板
2. 按 `Ctrl+Shift+P`（或 `Cmd+Shift+P`）打开命令面板
3. 输入 "Typst Table Paste: Convert Table"
4. 按 Enter 执行转换

### 工作流程

1. **复制表格** → 从 Excel/Word
2. **粘贴** → 按 `Ctrl+Shift+V`
3. **自动处理**：
   - 创建 `typ_tables/` 文件夹（如果不存在）
   - 生成单独的表格文件（例如 `table_001.typ`）
   - 在当前位置插入引用：`#figure(include "typ_tables/table_001.typ")`
4. **编辑** → 您可以单独编辑表格文件，保持主文件整洁

## 配置选项

在 VSCode 设置中搜索 "Typst Table Paste" 可找到以下选项：

- `typstTablePaste.autoConvert`：粘贴时自动转换表格（默认：true）
- `typstTablePaste.preserveSuperscript`：保留显著性标记为上标（默认：true）
- `typstTablePaste.preserveBorders`：保留表格边框样式（默认：true）
- `typstTablePaste.preserveAlignment`：保留表格对齐方式（默认：true）
- `typstTablePaste.threeLineTable`：使用三线表格式（仅顶线、表头底线、底线）（默认：false）
- `typstTablePaste.autoMathMode`：自动将变量名和 R² 转换为数学模式（$variable$）（默认：false）
- `typstTablePaste.mathModeExclusions`：从数学模式转换中排除的术语列表（默认：["Constant", "Controls", "Observations", "R-squared", "Adjusted R-squared", "N", "Fixed Effects", "Year FE", "Firm FE", "Industry FE", "Country FE"]）
- `typstTablePaste.addDividerAfterConstant`：在 Constant 行后添加分割线，将回归系数与固定效应部分分开（默认：false）
- `typstTablePaste.tableFolder`：保存表格文件的文件夹名称（默认："typ_tables"）
- `typstTablePaste.includeTemplate`：表格引用模板（默认："#figure(include \"{path}\")"）

## 示例

### 输入（CSV）

```csv
="",="(1)",="(2)",="(3)"
="Variable",="Coef",="SE"
="X1",="0.05***",="0.01"
```

### 输出（Typst）

小表格（3 列）：
```typst
#table(
  columns: (auto, 1fr, 1fr),
  align: (left, center, center),

  [], [(1)], [(2)],

  [Variable], [Coef], [SE],

  [X1], [0.05#super[\*\*\*]], [0.01],
)
```

大表格（7 列）：
```typst
#table(
  columns: (auto, 1fr, 1fr, 1fr, 1fr, 1fr, 1fr),
  align: (left, center, center, center, center, center, center),

  [],
  [(1)],
  [(2)],
  [(3)],
  [(4)],
  [(5)],
  [(6)],


  [Variable],
  [Coef1],
  [Coef2],
  [Coef3],
  [Coef4],
  [Coef5],
  [Coef6],
)
```

## 支持的格式

### CSV 格式

- **标准 CSV**：逗号分隔，例如 `Header1,Value1,Value2`
- **等号分隔 CSV**：使用 `="value"` 格式，例如 `="Header1",="Value1"`

### RTF 格式

- 从 Microsoft Word 复制的表格
- 从 Microsoft Excel 复制的表格
- 从其他支持 RTF 格式的应用程序复制的表格

## 开发

### 设置

```bash
git clone https://github.com/leichaoL/typst-table-paste.git
cd typst-table-paste
npm install
```

### 编译

```bash
npm run compile
```

### 调试

在 VSCode 中按 `F5` 启动调试。

### 打包

```bash
npm install -g @vscode/vsce
vsce package
```

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本历史。

## 许可证

MIT License - 详见 [LICENSE](LICENSE)。
