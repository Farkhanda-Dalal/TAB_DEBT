export async function getTabsToClean(
  protectedUrls: string[] = [],
): Promise<chrome.tabs.Tab[]> {
  // Grab all tabs across all open Chrome windows
  const tabs = await chrome.tabs.query({});

  // Filter out tabs we must never touch
  return tabs.filter((tab) => {
    // 1. Keep the active tab in any window open
    if (tab.active) return false;

    // 2. Ignore empty or system tabs
    if (!tab.url) return false;

    // 3. Never close the extension's own pages
    if (tab.url.startsWith("chrome-extension://")) return false;

    // 4. Strict check against the exact protected URLs list
    if (protectedUrls.includes(tab.url)) return false;

    // Keep it in the clean list if it passes all protection checks
    return true;
  });
}
