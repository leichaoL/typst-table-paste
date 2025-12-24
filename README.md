# Typst Table Paste

[![en](https://img.shields.io/badge/lang-English-red.svg)](README.md)
[![cn](https://img.shields.io/badge/%E8%AF%AD%E8%A8%80-%E4%B8%AD%E6%96%87-yellow.svg)](README_zh.md)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue)](https://marketplace.visualstudio.com/items?itemName=leichaoL.typst-table-paste)
![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/i/leichaoL.typst-table-paste.svg)
![GitHub all releases](https://img.shields.io/github/downloads/leichaoL/typst-table-paste/total.svg)
[![Version](https://img.shields.io/visual-studio-marketplace/v/leichaoL.typst-table-paste)](https://marketplace.visualstudio.com/items?itemName=leichaoL.typst-table-paste)
[![License](https://img.shields.io/github/license/leichaoL/typst-table-paste)](https://github.com/leichaoL/typst-table-paste/blob/main/LICENSE)

English | [简体中文](README_zh.md)

A VSCode extension that automatically converts RTF or CSV tables from the clipboard to Typst table syntax. Ideal for regression tables, academic papers, and quick table reuse in Typst.

## 🖼️ Demo

![Paste from Excel to Typst](assets/demo-paste.gif)

## 🚀 Quick Start

### Create from Clipboard

1. Copy a table from Excel, Word, or a CSV source.
2. In a `.typ` file, press `Ctrl+Shift+V` (or `Cmd+Shift+V`).
3. A table file is saved to `typ_tables/`, and a reference is inserted at the cursor.
4. You can edit the table file separately to keep your main file clean.

Note: Use `Ctrl+Shift+V` instead of `Ctrl+V` to avoid conflicts with other paste extensions (like typst-figure-pastetools).

### Create from CSV File

1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P`) to open the command palette.
2. Type "Typst Table Paste: Convert From File".
3. Select one or more CSV files to import.
4. Tables are saved to `typ_tables/`; multiple CSV files are merged into one table, and a reference is inserted at the cursor.

## ✨ Features

### Core Features

- RTF/CSV table detection (including equals-separated CSV)
- Preserve significance markers, borders, and alignment
- Automatic layout for small vs. large tables (≤5 columns: compact, >5 columns: expanded)
- Save table files and insert references automatically
- Sequential file naming (`table_001.typ`, `table_002.typ`, etc.)

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

### RTF Format

- Tables copied from Microsoft Word
- Tables copied from Microsoft Excel
- Tables copied from other applications that support RTF format

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

Example `settings.json`:

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

## 🧭 Planned

- Import Excel files directly
- Copy tables directly from Stata console

## 🐛 Known Issues

- Underscore symbols `_` in variable names are not escaped
- Some variable names cannot be automatically converted to math mode

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
