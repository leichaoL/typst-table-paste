const fs = require('fs');

function extractChangelog(version) {
  const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');

  // 匹配版本块的正则表达式
  const versionRegex = new RegExp(
    `## \\[${version}\\][\\s\\S]*?(?=## \\[|$)`,
    'g'
  );

  const match = changelog.match(versionRegex);
  if (!match) {
    throw new Error(`Version ${version} not found in CHANGELOG.md`);
  }

  // 移除版本标题行，只保留内容
  let content = match[0];
  // 移除第一行（版本标题行）
  content = content.split('\n').slice(1).join('\n');

  return content.trim();
}

// 从命令行参数读取版本号
const version = process.argv[2];
if (!version) {
  console.error('Usage: node extract-changelog.js <version>');
  process.exit(1);
}

try {
  const changelog = extractChangelog(version);
  console.log(changelog);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
