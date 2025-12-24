# Typst Table Paste

[![en](https://img.shields.io/badge/lang-English-red.svg)](README.md)
[![cn](https://img.shields.io/badge/%E8%AF%AD%E8%A8%80-%E4%B8%AD%E6%96%87-yellow.svg)](README_zh.md)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue)](https://marketplace.visualstudio.com/items?itemName=leichaoL.typst-table-paste)
![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/i/leichaoL.typst-table-paste.svg)
![GitHub all releases](https://img.shields.io/github/downloads/leichaoL/typst-table-paste/total.svg)
[![Version](https://img.shields.io/visual-studio-marketplace/v/leichaoL.typst-table-paste)](https://marketplace.visualstudio.com/items?itemName=leichaoL.typst-table-paste)
[![License](https://img.shields.io/github/license/leichaoL/typst-table-paste)](https://github.com/leichaoL/typst-table-paste/blob/main/LICENSE)

[English](README.md) | 简体中文

一个 VSCode 扩展，可以自动将剪贴板中的 RTF 或 CSV 表格转换为 Typst 表格语法。适合回归表、学术论文和快速复用表格。

## 🖼️ 演示

![demo-paste.gif](https://s2.loli.net/2025/12/24/fXKEjgI2Jtx3paB.gif)

## 🚀 快速开始

### 从剪贴板创建表格

1. 从 Excel、Word 或 CSV 源复制表格。
2. 在 `.typ` 文件中按 `Ctrl+Shift+V`（或 `Cmd+Shift+V`）。
3. 表格会保存到 `typ_tables/`，并在光标位置插入引用。
4. 您可以单独编辑表格文件，保持主文件整洁。

注意：使用 `Ctrl+Shift+V` 而不是 `Ctrl+V`，以避免与其他粘贴扩展（如 typst-figure-pastetools）冲突。

### 从CSV文件中创建表格

1. 按 `Ctrl+Shift+P`（或 `Cmd+Shift+P`）打开命令面板
2. 输入 "Typst Table Paste: Convert From File"
3. 选择 CSV 或 Excel 文件（可多选）进行导入
4. 对于包含多个工作表的 Excel 文件，选择要转换的工作表
5. 表格会保存到 `typ_tables/`，多个文件会合并成一张表，并在光标位置插入引用。

## ✨ 功能特性

### 核心功能

- RTF/CSV 表格识别（支持等号分隔 CSV）
- 显著性标记、边框、对齐方式等格式保留
- 小/大表格的自动排版策略（≤5 列：紧凑格式，>5 列：展开格式）
- 表格文件自动保存与引用插入
- 顺序文件命名（`table_001.typ`、`table_002.typ` 等）

### 学术论文支持

- 自动转换成三线表或者是自动隔开回归系数（可选）
- 自动将变量名和 R² 转换为数学模式（可选）
- 交互项格式化（`*` → `times`）
- 希腊字母识别

### 高级功能

- 剪贴板文件路径检测（支持 Windows/Unix 路径、引号路径、file:// URI）
- 多个 CSV 文件导入的面板系统

## 📦 安装

### 从源码安装

1. 克隆或下载本项目
2. 在项目目录中运行：

   ```bash
   npm install
   npm run compile
   ```

3. 在 VSCode 中按 `F5` 启动调试模式

### 从市场安装

在 VSCode 扩展市场中搜索 "[Typst Table Paste](https://marketplace.visualstudio.com/items?itemName=leichaoL.typst-table-paste)"。

## 🧪 示例

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

### 数学模式转换示例

当启用 `autoMathMode` 时：

**输入（CSV）：**
```csv
Variable,(1),(2)
log_gdp,0.45***,0.52***
gdp_growth,0.12*,0.15**
alpha * beta,0.08,0.10
ln(population),0.23**,0.25**
```

**输出（Typst）：**
```typst
#table(
  columns: (auto, 1fr, 1fr),
  align: (left, center, center),

  [Variable], [(1)], [(2)],

  [$log_"gdp"$], [0.45#super[\*\*\*]], [0.52#super[\*\*\*]],
  [$"gdp"_"growth"$], [0.12#super[\*]], [0.15#super[\*\*]],
  [$alpha times beta$], [0.08], [0.10],
  [$ln("population")$], [0.23#super[\*\*]], [0.25#super[\*\*]],
)
```

### 三线表示例

当启用 `threeLineTable` 时：

```typst
#table(
  columns: (auto, 1fr, 1fr),
  align: (left, center, center),
  stroke: none,

  table.hline(),
  [], [(1)], [(2)],
  table.hline(stroke: 0.5pt),

  [Variable], [Coef], [SE],
  [X1], [0.05#super[\*\*\*]], [0.01],

  table.hline(),
)
```

### 自定义引用模板示例

您可以使用 `includeTemplate` 设置自定义表格引用的插入方式：

**默认：**
```json
"typstTablePaste.includeTemplate": "#figure(include \"{path}\")"
```

**带标题：**
```json
"typstTablePaste.includeTemplate": "#figure(include \"{path}\", caption: [Table])"
```

**简单引用：**
```json
"typstTablePaste.includeTemplate": "#include \"{path}\""
```

**自定义包装器：**
```json
"typstTablePaste.includeTemplate": "#block(include \"{path}\")"
```

## 🧩 支持的格式

### CSV 格式

- **标准 CSV**：逗号分隔，例如 `Header1,Value1,Value2`
- **等号分隔 CSV**：使用 `="value"` 格式，例如 `="Header1",="Value1"`

### Excel 格式

- **Excel 文件**：支持 `.xlsx`、`.xls`、`.xlsm` 格式
- **多工作表**：可选择特定工作表或转换所有工作表
- **自动数据提取**：从单元格中提取格式化后的值

### RTF 格式

- 从 Microsoft Word 复制的表格
- 从 Microsoft Excel 复制的表格
- 从其他支持 RTF 格式的应用程序复制的表格

## 🛠️ 配置选项

在 VSCode 设置中搜索 "Typst Table Paste" 可找到以下选项：

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `typstTablePaste.autoConvert` | `true` | 粘贴时自动转换表格 |
| `typstTablePaste.preserveSuperscript` | `true` | 保留显著性标记为上标 |
| `typstTablePaste.preserveBorders` | `true` | 保留表格边框样式 |
| `typstTablePaste.preserveAlignment` | `true` | 保留表格对齐方式 |
| `typstTablePaste.threeLineTable` | `false` | 使用三线表格式（仅顶线、表头底线、底线） |
| `typstTablePaste.autoMathMode` | `false` | 自动将变量名和 R² 转换为数学模式 |
| `typstTablePaste.mathModeExclusions` | `["Constant", "Controls", "Observations", "N", "Fixed Effects", "Year FE", "Firm FE", "Industry FE", "Country FE"]` | 排除数学模式转换的术语列表 |
| `typstTablePaste.addDividerAfterConstant` | `false` | 在 `Constant` 行后添加分割线 |
| `typstTablePaste.tableFolder` | `"typ_tables"` | 保存表格文件的文件夹名称 |
| `typstTablePaste.includeTemplate` | `"#figure(include \"{path}\")"` | 引用模板 |

`settings.json` 示例：

```json
{
  "typstTablePaste.autoConvert": true,
  "typstTablePaste.threeLineTable": false,
  "typstTablePaste.addDividerAfterConstant": false,
  "typstTablePaste.autoMathMode": false,
  "typstTablePaste.tableFolder": "typ_tables",
  "typstTablePaste.includeTemplate": "#figure(include \"{path}\")"
}
```

## ❓ 常见问题

- **粘贴没有反应**：确认当前文件为 `.typ`，并使用 `Ctrl+Shift+V`，检查是否有快捷键冲突。
- **与其他粘贴扩展冲突**：建议使用 `Ctrl+Shift+V`，或改用自定义快捷键。
- **R² 或变量未转为数学模式**：启用 `typstTablePaste.autoMathMode`，并确认不在 `mathModeExclusions` 中。
- **修改输出文件夹**：配置 `typstTablePaste.tableFolder`。
- **无法直接导入 RTF 文件**：RTF 文件只能从剪贴板处理（从 Word/Excel 复制）。"从文件转换"功能仅支持 CSV 文件。

## 🔒 隐私

剪贴板内容仅在本地 VSCode 中处理，不会发送到网络。

## 🧰 开发

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

## 🧭 已知问题与待实现功能

- [ ] 直接从 Stata console 中复制表格

## 📝 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本历史。

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)。
