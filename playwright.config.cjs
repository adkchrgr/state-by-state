module.exports = {
  testDir: "./tests",
  testMatch: "ui.spec.cjs",
  timeout: 30000,
  use: { viewport: { width: 1360, height: 1000 }, headless: true },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  reporter: "list",
};
