const fs = require('fs');
const content = fs.readFileSync('src/components/layout/TacticalBar.tsx', 'utf8');

let newContent = content.replace(
  /<Button\s*asChild\s*size="sm"\s*variant="outline"/g,
  `<Button
          asChild
          size="sm"
          variant="outline"`
);

newContent = newContent.replace(
  /\n\s*<Link to=\{alert\.action\.to\}>\{alert\.action\.label\}<\/Link>\n\s*<\/Button>/g,
  `\n          >\n            <Link to={alert.action.to}>{alert.action.label}</Link>\n          </Button>`
);

fs.writeFileSync('src/components/layout/TacticalBar.tsx', newContent);
