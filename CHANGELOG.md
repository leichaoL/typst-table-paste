# Changelog

All notable changes to the "Typst Table Paste" extension will be documented in this file.

## [0.2.0] - 2025-12-20

### Added
- **Smart Code Formatting**: Automatically chooses formatting strategy based on column count
  - Small tables (≤ 5 columns): All cells in one row, with blank lines between rows
  - Large tables (> 5 columns): Each cell on its own line, with two blank lines between rows
  - Added blank line at table header for clearer structure

- **Detailed Debug Logging**: Added complete execution flow logging for easier troubleshooting

### Changed
- **Keyboard Shortcut**: Changed from `Ctrl+V` to `Ctrl+Shift+V`
  - Avoids conflicts with typst-figure-pastetools and other extensions
  - `Ctrl+V` for image pasting, `Ctrl+Shift+V` for table pasting
- **Project Renamed**: From `paste2typ` to `typst-table-paste`
- Improved readability of generated Typst code
- Optimized table formatting logic
- Added extension activation notification


## [0.1.0] - 2025-12-19

### Added
- Initial release
- CSV/TSV table parsing support
- RTF table parsing support
- Automatic conversion to Typst table syntax
- Separate table file generation (typ_tables/ folder)
- Automatic file naming (table_001.typ, table_002.typ...)
- Reference code insertion (#figure(include "..."))
- Asterisk escaping and superscript handling
- Table border and alignment preservation
- Configuration options support
