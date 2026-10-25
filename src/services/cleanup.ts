export function getTabsToClose(tabs: chrome.tabs.Tab[], staleThresholdMinutes: number) {
  const tabsByUrl = new Map<string, chrome.tabs.Tab[]>();
  const tabsToClose = new Set<chrome.tabs.Tab>();
  let duplicateCount = 0; // New metric tracker

  // Group tabs by exact URL
  for (const tab of tabs) {
    if (!tab.url) continue;
    const existing = tabsByUrl.get(tab.url) || [];
    existing.push(tab);
    tabsByUrl.set(tab.url, existing);
  }

  const thresholdMs = staleThresholdMinutes * 60 * 1000;
  const now = Date.now();

  for (const tabGroup of tabsByUrl.values()) {
    tabGroup.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
    const keeper = tabGroup[0];

    // 1. Mark newer duplicates for closure
    for (let i = 1; i < tabGroup.length; i++) {
      tabsToClose.add(tabGroup[i]);
      duplicateCount++; 
    }

    // 2. Check if keeper is stale
    if (keeper.lastAccessed && (now - keeper.lastAccessed) > thresholdMs) {
      tabsToClose.add(keeper);
    }
  }

  // Return both the tabs and the duplicate count
  return { 
    tabsToClose: Array.from(tabsToClose), 
    duplicateCount 
  };
}