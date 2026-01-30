# Changelog

All notable changes to the "Typst Table Paste" extension will be documented in this file.

## [0.8.0] - 2026-01-30

### Added

- **Number rounding feature**: Round numbers in existing `.typ` table files
  - Two ways to trigger: from editor or right-click in file explorer
  - Choose to overwrite or save as new file
  - New setting: `roundingDecimalPlaces` (default: 3 decimal places)
- **Internationalization (i18n)**: Commands and settings now display in your VSCode language
  - English (default)
  - Simplified Chinese (简体中文)

### 新增

- **数字四舍五入功能**：对已有的 `.typ` 表格文件中的数字进行四舍五入
  - 两种触发方式：从编辑器或在文件浏览器中右键
  - 可选择覆盖原文件或保存为新文件
  - 新增设置：`roundingDecimalPlaces`（默认 3 位小数）
- **国际化支持**：命令和设置现在会根据 VSCode 语言显示
  - 英文（默认）
  - 简体中文

## [0.7.0] - 2026-01-16

### Added

- **RTF table import support**: Import tables directly from RTF files (Word, Stata output)
  - **Note**: RTF conversion may not be perfect for all tables. For best results, export to CSV/Excel format first. If you encounter issues, please submit an issue on GitHub.

### Fixed

- **CSV file title extraction**: Fixed bug where CSV files couldn't automatically use filename as table title
- **Panel title escaping**: Fixed special character escaping in panel titles when importing multiple files


### 新增

- **RTF 表格导入支持**：直接从 RTF 文件导入表格（Word、Stata 输出）
  - **注意**：RTF 转换可能不是对所有表格都完美。为获得最佳效果，建议先导出为 CSV/Excel 格式。如果遇到问题，请在 GitHub 上提交 issue。

### 修复

- **CSV 文件标题提取**：修复了 CSV 文件无法自动使用文件名作为表格标题的 bug
- **Panel 标题转义**：修复了导入多个文件时表格标题特殊符号的转义问题


## [0.6.0] - 2026-01-11

### Added

- **Table file renaming**: Rename table files with automatic reference updates across workspace
  - Press `Shift+F2` on include statement or right-click to rename
  - Right-click `.typ` files in explorer for quick rename
- **Smart file naming**: Use source filenames instead of sequential numbers (e.g., `data.csv` → `data.typ`)
- **New setting**: `promptForTableName` - optionally prompt for custom filename when importing


### Fixed

- Fix Excel file import failure

### 新增

- **表格文件重命名**：重命名表格文件并自动更新所有引用
  - 在 include 语句行按 `Shift+F2` 或右键重命名
  - 右键点击文件浏览器中的 `.typ` 文件快速重命名
- **智能文件命名**：导入文件时使用源文件名而非顺序编号（例如：`data.csv` → `data.typ`）
- **新增设置**：`promptForTableName` - 可选择在导入时提示输入自定义文件名


### 修复

- 修复 Excel 文件导入失败的问题

## [0.5.0] - 2026-01-03

### Added

- **Stata console table support (Experimental)**: Copy tables directly from Stata console output and convert to Typst format
  - Basic table structure detection for Stata output
  - Automatic parsing of console text format
  - **Limitation**: This is an experimental feature. Simple tables work well, but complex tables may not convert perfectly. For best results, export tables to CSV/Excel format first.

### 新增

- **Stata console 表格支持（实验性）**：直接从 Stata console 输出复制表格并转换为 Typst 格式
  - 基本的 Stata 输出表格结构检测
  - 自动解析 console 文本格式
  - **限制**：这是一个实验性功能。简单表格可以很好地转换，但复杂表格可能无法完美转换。为获得最佳效果，建议先将表格导出为 CSV/Excel 格式。

## [0.4.0] - 2025-12-24

### Added

- **Excel file import support**: Import Excel files (.xlsx, .xls, .xlsm) directly via "Convert from File" command
- **Multi-sheet Excel handling**: Select specific sheets or convert all sheets from Excel files
- **Enhanced math mode conversion**: Support for variables with commas, slashes, and parentheses (e.g., `Job tenure, in years`, `ln(wage/GNP deflator)`)
- **Stata constant recognition**: Added `_cons` and `cons` to boundary keywords and exclusion list

### Fixed

- Fixed underscore escaping in variable names (e.g., `log_gdp` now correctly escapes to `log\_gdp`)
- Fixed superscript placeholder escaping bug that caused `{{SUPER0}}` to appear in output
- Fixed exclusion list matching to avoid false positives (e.g., "N" in "GNP" no longer triggers exclusion)
- Improved math mode detection for variables starting with numbers (e.g., `1 if not SMSA`)

### Improved

- Enhanced math mode conversion regex to support more variable name patterns
- Better number detection to distinguish between statistical values and variable names
- More precise exclusion list matching (single-letter exclusions use exact match)

### 新增

- **Excel 文件导入支持**：通过"从文件转换"命令直接导入 Excel 文件（.xlsx、.xls、.xlsm）
- **多工作表 Excel 处理**：从 Excel 文件中选择特定工作表或转换所有工作表
- **增强的数学模式转换**：支持包含逗号、斜杠和括号的变量（例如 `Job tenure, in years`、`ln(wage/GNP deflator)`）
- **Stata 常数识别**：将 `_cons` 和 `cons` 添加到边界关键词和排除列表

### 修复

- 修复了变量名中的下划线转义问题（例如 `log_gdp` 现在正确转义为 `log\_gdp`）
- 修复了上标占位符转义错误，该错误导致 `{{SUPER0}}` 出现在输出中
- 修复了排除列表匹配以避免误报（例如"GNP"中的"N"不再触发排除）
- 改进了以数字开头的变量的数学模式检测（例如 `1 if not SMSA`）

### 改进

- 增强了数学模式转换正则表达式以支持更多变量名模式
- 更好的数字检测以区分统计值和变量名
- 更精确的排除列表匹配（单字母排除使用精确匹配）

## [0.3.1] - 2025-12-24

### Documentation

- Documentation improvements: Synchronized EN/CN READMEs, fixed config docs, added more examples
- 文档改进：同步中英文 README，修复配置文档错误，添加更多示例和功能说明


## [0.3.0] - 2025-12-21

### Added

- **Convert from File**: New command `Typst Table Paste: Convert from File` to select CSV files for conversion
- **Smart Panel Layout**: When converting multiple CSV files at once, automatically convert into a single table with multiple Panels, with panel titles set to file names
- **Optional divider after Constant**: New configuration option `addDividerAfterConstant` to insert a horizontal line between regression coefficients and fixed effects section

### Fixed

- CSV file parsing now correctly handles both CRLF and LF line endings
- Fixed empty cell rows appearing at the end of clipboard-converted tables
- Fixed extra blank lines between panels in multi-file conversion

### 新增

- **从文件中转换**：新命令 `Typst Table Paste: Convert from File`，选择一个或多个 CSV 文件进行转换
- **智能面板布局**：同时选择多个 CSV 文件进行转换时，自动转换成单表多Panel的形式，Panel标题自动设置为文件名
- **Constant 后可选分割线**：新增配置选项 `addDividerAfterConstant`，在回归系数和固定效应部分之间插入水平线

### 修复

- CSV 文件解析现在正确处理 CRLF 和 LF 行尾符
- 修复了剪贴板转换表格末尾出现空单元格行的问题
- 修复了多文件转换中面板之间多余空行的问题

## [0.2.0] - 2025-12-20

### Changed

- **Keyboard Shortcut**: Changed from `Ctrl+V` to `Ctrl+Shift+V`
  - Avoids conflicts with typst-figure-pastetools and other extensions
  - `Ctrl+V` for image pasting, `Ctrl+Shift+V` for table pasting
- **Project Renamed**: From `paste2typ` to `typst-table-paste`
- Improved readability of generated `.typ` code and optimized table formatting logic

### 变更

- **键盘快捷键**：从 `Ctrl+V` 更改为 `Ctrl+Shift+V`
  - 避免与 typst-figure-pastetools 和其他扩展冲突
  - `Ctrl+V` 用于图片粘贴，`Ctrl+Shift+V` 用于表格粘贴
- **项目重命名**：从 `paste2typ` 改为 `typst-table-paste`
- 改进了生成的 `.typ` 代码的可读性，优化了表格格式化逻辑

## [0.1.0] - 2025-12-19

### Added

- Initial release
- CSV/TSV table parsing support
- RTF table parsing support
- Automatic conversion to Typst table syntax
- Separate table file generation (`typ_tables/` folder)
- Automatic file naming (`table_001.typ`, `table_002.typ`...)
- Reference code insertion (`#figure(include "...")`)
- Asterisk escaping and superscript handling
- Table border and alignment preservation
- Configuration options support

### 新增

- 初始版本发布
- CSV/TSV 表格解析支持
- RTF 表格解析支持
- 自动转换为 Typst 表格语法
- 单独的表格文件生成（`typ_tables/` 文件夹）
- 自动文件命名（`table_001.typ`、`table_002.typ`...）
- 引用代码插入（`#figure(include "...")`）
- 星号转义和上标处理
- 表格边框和对齐方式保留
- 配置选项支持
