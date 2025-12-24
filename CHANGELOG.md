# Changelog

All notable changes to the "Typst Table Paste" extension will be documented in this file.

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
