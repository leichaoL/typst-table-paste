# Typst Table Paste

A VSCode extension that automatically converts RTF or CSV tables from clipboard to Typst table syntax.

## Features

- ✅ **Automatic Conversion**: Automatically detects and converts table formats when pasting
- ✅ **Multiple Format Support**:
  - RTF tables (copied from Word, Excel)
  - CSV tables (standard comma-separated and equals-separated formats)
  - Extract tables from entire document content
- ✅ **Format Preservation**:
  - Significance markers (`***`, `**`, `*`) converted to Typst superscript syntax
  - Table border styles (top lines, bottom lines, etc.)
  - Three-line table format for academic papers
  - Alignment (left, center, right)
  - Automatic column width settings
- ✅ **Smart Formatting**:
  - Small tables (≤ 5 columns): All cells in one row, with blank lines between rows
  - Large tables (> 5 columns): Each cell on its own line, with two blank lines between rows
  - Auto-convert variable names and R² to math mode (optional)
- ✅ **File Management**:
  - Tables saved to separate files in `typ_tables/` folder
  - Automatic file naming (`table_001.typ`, `table_002.typ`, ...)
  - Insert reference code at paste location
  - Support for multiple tables in one paste operation

## Installation

### From Source

1. Clone or download this project
2. Run in the project directory:
   ```bash
   npm install
   npm run compile
   ```
3. Press `F5` in VSCode to start debugging mode

### From Marketplace (Coming Soon)

Search for "Typst Table Paste" in the VSCode extension marketplace.

## Usage

### Keyboard Shortcut (Recommended)

1. Copy a table from Excel, Word, or other applications
2. In a Typst file (`.typ`), press `Ctrl+Shift+V` (or `Cmd+Shift+V`) to paste
3. The extension will automatically detect and convert to Typst table syntax
4. The table will be saved to the `typ_tables/` folder, and a reference will be inserted at the current location

**Note**: Use `Ctrl+Shift+V` instead of `Ctrl+V` to avoid conflicts with other paste extensions (like typst-figure-pastetools).

### Manual Conversion

1. Copy a table to clipboard
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P`) to open the command palette
3. Type "Typst Table Paste: Convert Table"
4. Press Enter to execute the conversion

### Workflow

1. **Copy Table** → From Excel/Word
2. **Paste** → Press `Ctrl+Shift+V`
3. **Automatic Processing**:
   - Creates `typ_tables/` folder (if it doesn't exist)
   - Generates a separate table file (e.g., `table_001.typ`)
   - Inserts reference at current location: `#figure(include "typ_tables/table_001.typ")`
4. **Edit** → You can edit the table file separately, keeping the main file clean

## Configuration

Search for "Typst Table Paste" in VSCode settings to find the following options:

- `typstTablePaste.autoConvert`: Automatically convert tables when pasting (default: true)
- `typstTablePaste.preserveSuperscript`: Preserve significance markers as superscript (default: true)
- `typstTablePaste.preserveBorders`: Preserve table border styles (default: true)
- `typstTablePaste.preserveAlignment`: Preserve table alignment (default: true)
- `typstTablePaste.threeLineTable`: Use three-line table format (top, header bottom, bottom lines only) (default: false)
- `typstTablePaste.autoMathMode`: Automatically convert variable names and R² to math mode ($variable$) (default: false)
- `typstTablePaste.mathModeExclusions`: List of terms to exclude from math mode conversion (default: ["Constant", "Controls", "Observations", "R-squared", "Adjusted R-squared", "N", "Fixed Effects", "Year FE", "Firm FE", "Industry FE", "Country FE"])
- `typstTablePaste.tableFolder`: Folder name for saving table files (default: "typ_tables")
- `typstTablePaste.includeTemplate`: Template for table references (default: "#figure(include \"{path}\")")

## Example

### Input (CSV)

```csv
="",="(1)",="(2)",="(3)"
="Variable",="Coef",="SE"
="X1",="0.05***",="0.01"
```

### Output (Typst)

Small table (3 columns):
```typst
#table(
  columns: (auto, 1fr, 1fr),
  align: (left, center, center),

  [], [(1)], [(2)],

  [Variable], [Coef], [SE],

  [X1], [0.05#super[\*\*\*]], [0.01],
)
```

Large table (7 columns):
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

## Supported Formats

### CSV Format

- **Standard CSV**: Comma-separated, e.g., `Header1,Value1,Value2`
- **Equals-separated CSV**: Using `="value"` format, e.g., `="Header1",="Value1"`

### RTF Format

- Tables copied from Microsoft Word
- Tables copied from Microsoft Excel
- Tables copied from other applications that support RTF format

## Development

### Setup

```bash
git clone https://github.com/leichaoL/typst-table-paste.git
cd typst-table-paste
npm install
```

### Compile

```bash
npm run compile
```

### Debug

Press `F5` in VSCode to start debugging.

### Package

```bash
npm install -g @vscode/vsce
vsce package
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.


## License

MIT License - see [LICENSE](LICENSE) for details.

