# Typst Table Paste

[![en](https://img.shields.io/badge/lang-English-red.svg)](./README.md)
[![cn](https://img.shields.io/badge/语言-中文-yellow.svg)](./README_zh.md)
[![VS Code Marketplace](https://vsmarketplacebadges.dev/version-short/leichaoL.typst-table-paste.svg?label=VS%20Code)](https://marketplace.visualstudio.com/items?itemName=leichaoL.typst-table-paste)
[![VS Code Installs](https://vsmarketplacebadges.dev/installs-short/leichaoL.typst-table-paste.svg?label=VS%20Code%20installs)](https://marketplace.visualstudio.com/items?itemName=leichaoL.typst-table-paste)
[![GitHub Downloads](https://img.shields.io/github/downloads/leichaoL/typst-table-paste/total.svg)](https://github.com/leichaoL/typst-table-paste/releases)
[![GitHub License](https://img.shields.io/github/license/leichaoL/typst-table-paste)](https://github.com/leichaoL/typst-table-paste/blob/main/LICENSE)

English | [简体中文](README_zh.md)

A VSCode extension that automatically converts RTF or CSV tables from the clipboard to Typst table syntax. Ideal for regression tables, academic papers, and quick table reuse in Typst.

## 🖼️ Demo

![demo-paste.gif](https://s2.loli.net/2025/12/24/fXKEjgI2Jtx3paB.gif)

## 🚀 Quick Start

### Create from Clipboard

1. Copy a table from Excel, Word, or a CSV source.
2. In a `.typ` file, press `Ctrl+Shift+V` (or `Cmd+Shift+V`).
3. A table file is saved to `typ_tables/`, and a reference is inserted at the cursor.
4. You can edit the table file separately to keep your main file clean.

Note: Use `Ctrl+Shift+V` instead of `Ctrl+V` to avoid conflicts with other paste extensions (like typst-figure-pastetools).

### Create from CSV/Excel/RTF File

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P`) to open the command palette.
2. Type "Typst Table Paste: Convert From File".
3. Select one or more CSV, Excel, or RTF files to import.
4. For Excel files with multiple sheets, choose which sheet(s) to convert.
5. Tables are saved to `typ_tables/` using source filenames (e.g., `data.csv` → `data.typ`).

**Note on RTF files**: RTF table conversion may not be perfect for all tables. For best results, export to CSV/Excel format first. If you encounter conversion issues, please submit an issue on GitHub.

### Rename Table Files

Rename table files with automatic reference updates:

- **In editor**: Press `Shift+F2` on include statement line or right-click → "Rename Table File"
- **In explorer**: Right-click `.typ` file in `typ_tables/` → "Rename Typst Table"

All references are automatically updated across workspace.

### Round Numbers in Tables

Round numbers in existing `.typ` table files to a specified number of decimal places:

- **In editor**: Open a `.typ` file, then use command palette → "Typst Table Paste: Round Numbers in Table"
- **In explorer**: Right-click any `.typ` file → "Round Numbers in Table"
- Choose to overwrite the original file or save as a new file
- Supports multiple number formats:
  - Normal numbers: `0.123456` → `0.123`
  - Scientific notation: `1.23456e-5` → `1.235e-5`
  - Percentages: `12.3456%` → `12.346%`
  - Parentheses: `(0.045678)` → `(0.046)`
  - Typst syntax: `0.123456#super[***]` → `0.123#super[***]`
- Configure decimal places in settings (default: 3)

## ✨ Features

### Core Features

- **RTF/CSV/Excel table detection and conversion**
  - Supports Word RTF, Stata RTF, CSV, and Excel formats
  - Automatic table structure detection
  - Preserves borders, alignment, and formatting
- Preserve significance markers, borders, and alignment
- Automatic layout for small vs. large tables (≤5 columns: compact, >5 columns: expanded)
- Smart file naming from source filenames (e.g., `data.csv` → `data.typ`)
- Rename tables with automatic reference updates (Shift+F2)
- Auto-number duplicate filenames (e.g., `data.typ`, `data_1.typ`, `data_2.typ`)
- **Round numbers in tables**: Process existing `.typ` files to round numbers to specified decimal places

### Academic Paper Support
- Three-line table format and automatic divider insertion (optional)
- Automatic math mode conversion for variable names and R² (optional)
- Interaction term formatting (`*` → `times`)
- Greek letter recognition

### Advanced Features
- File path detection from clipboard (supports Windows/Unix paths, quoted paths, file:// URIs)
- Panel system for multiple CSV file imports

## 📦 Installation

### From Source

1. Clone or download this project
2. Run in the project directory:
   ```bash
   npm install
   npm run compile
   ```
3. Press `F5` in VSCode to start debugging mode

### From Marketplace

Search for "Typst Table Paste" in the VSCode extension marketplace.

## 🧪 Examples

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

### Math Mode Conversion Example

When `autoMathMode` is enabled:

**Input (CSV):**
```csv
Variable,(1),(2)
log_gdp,0.45***,0.52***
gdp_growth,0.12*,0.15**
alpha * beta,0.08,0.10
ln(population),0.23**,0.25**
```

**Output (Typst):**
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

### Three-Line Table Example

When `threeLineTable` is enabled:

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

### Custom Include Template Examples

You can customize how table references are inserted using the `includeTemplate` setting:

**Default:**
```json
"typstTablePaste.includeTemplate": "#figure(include \"{path}\")"
```

**With caption:**
```json
"typstTablePaste.includeTemplate": "#figure(include \"{path}\", caption: [Table])"
```

**Simple include:**
```json
"typstTablePaste.includeTemplate": "#include \"{path}\""
```

**Custom wrapper:**
```json
"typstTablePaste.includeTemplate": "#block(include \"{path}\")"
```

## 🧩 Supported Formats

### CSV Format

- **Standard CSV**: Comma-separated, e.g., `Header1,Value1,Value2`
- **Equals-separated CSV**: Using `="value"` format, e.g., `="Header1",="Value1"`

### Excel Format

- **Excel files**: `.xlsx`, `.xls`, `.xlsm` formats
- **Multiple sheets**: Choose specific sheets or convert all sheets
- **Automatic data extraction**: Extracts formatted values from cells

### RTF Format

- Tables copied from Microsoft Word
- Tables copied from Microsoft Excel
- Tables copied from other applications that support RTF format

### Stata Console Format (Experimental)

- Tables copied directly from Stata console output
- Basic table structure detection and conversion
- **Note**: This is an experimental feature. For complex tables, it's recommended to export the table to CSV or Excel first for better results.

## 🛠️ Configuration

Search for "Typst Table Paste" in VSCode settings.

| Setting | Default | Description |
| --- | --- | --- |
| `typstTablePaste.autoConvert` | `true` | Automatically convert tables when pasting |
| `typstTablePaste.preserveSuperscript` | `true` | Preserve significance markers as superscript |
| `typstTablePaste.preserveBorders` | `true` | Preserve table border styles |
| `typstTablePaste.preserveAlignment` | `true` | Preserve table alignment |
| `typstTablePaste.threeLineTable` | `false` | Use three-line table format (top, header bottom, bottom lines only) |
| `typstTablePaste.autoMathMode` | `false` | Automatically convert variable names and R² to math mode |
| `typstTablePaste.mathModeExclusions` | `["Constant", "Controls", "Observations", "N", "Fixed Effects", "Year FE", "Firm FE", "Industry FE", "Country FE"]` | Terms to exclude from math mode conversion |
| `typstTablePaste.addDividerAfterConstant` | `false` | Add a divider after the `Constant` row |
| `typstTablePaste.tableFolder` | `"typ_tables"` | Folder name for saving table files |
| `typstTablePaste.includeTemplate` | `"#figure(include \"{path}\")"` | Template for table references |
| `typstTablePaste.promptForTableName` | `false` | Prompt for table filename when pasting from clipboard or importing from file |
| `typstTablePaste.roundingDecimalPlaces` | `3` | Number of decimal places for rounding numbers in tables (0-10) |

Example `settings.json`:

```json
{
  "typstTablePaste.autoConvert": true,
  "typstTablePaste.threeLineTable": false,
  "typstTablePaste.addDividerAfterConstant": false,
  "typstTablePaste.autoMathMode": false,
  "typstTablePaste.tableFolder": "typ_tables",
  "typstTablePaste.includeTemplate": "#figure(include \"{path}\")",
  "typstTablePaste.roundingDecimalPlaces": 3
}
```

## ❓ FAQ & Troubleshooting

- **Nothing happens on paste**: Make sure the active file is `.typ`, and try `Ctrl+Shift+V`. Check for keybinding conflicts.
- **Conflicts with other paste extensions**: Prefer `Ctrl+Shift+V`, or remap the shortcut to avoid collisions.
- **R² or variables not in math mode**: Enable `typstTablePaste.autoMathMode` and ensure the term is not in `mathModeExclusions`.
- **Change output folder**: Set `typstTablePaste.tableFolder` to a custom path.
- **Cannot import RTF files directly**: RTF files can only be processed from clipboard (copy from Word/Excel). Use "Convert from File" only for CSV files.

## 🔒 Privacy

Clipboard data is processed locally in VSCode and is not sent over the network.

## 🧰 Development

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

## 🧭 Known Limitations

- **Stata console tables**: Experimental support available. Simple tables work well, but complex tables may not convert perfectly. For best results, export tables to CSV/Excel format first.


## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
