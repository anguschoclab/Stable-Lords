const fs = require('fs');
const content = fs.readFileSync('electron/main.ts', 'utf8');

const oldStr = `
  // Security: Prevent arbitrary navigation in all web contents
  app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'file:') {
        console.warn(\`Blocked unauthorized navigation to: \${navigationUrl}\`);
        event.preventDefault();
      } else if (isDev && parsedUrl.hostname !== 'localhost') {
        console.warn(\`Blocked unauthorized navigation to: \${navigationUrl}\`);
        event.preventDefault();
      } else if (!isDev && parsedUrl.protocol !== 'file:') {
        console.warn(\`Blocked unauthorized navigation to: \${navigationUrl}\`);
        event.preventDefault();
      }
    });
  });
`;

const newStr = `
  // Security: Prevent arbitrary navigation in all web contents
  app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'file:') {
        console.warn(\`Blocked unauthorized navigation to: \${navigationUrl}\`);
        event.preventDefault();
      } else if (isDev && parsedUrl.hostname !== 'localhost' && parsedUrl.hostname !== '127.0.0.1') {
        console.warn(\`Blocked unauthorized navigation to: \${navigationUrl}\`);
        event.preventDefault();
      } else if (!isDev && parsedUrl.protocol !== 'file:') {
        console.warn(\`Blocked unauthorized navigation to: \${navigationUrl}\`);
        event.preventDefault();
      }
    });
  });
`;

const updated = content.replace(oldStr.trim(), newStr.trim());
fs.writeFileSync('electron/main.ts', updated, 'utf8');
