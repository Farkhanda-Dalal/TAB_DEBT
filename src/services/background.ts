import { getTabsToClean } from "../services/tabs";
import { getTabsToClose } from "../services/cleanup";
import { summarizeTab } from "../services/ai";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "START_CLEANUP") {
    runCleanupCycle(message.payload).then(sendResponse);
    return true;
  }
});

async function runCleanupCycle(payload: {
  protectedUrls: string[];
  hfApiKey: string;
  staleThresholdMinutes: number;
}) {
  try {
    const { protectedUrls, hfApiKey, staleThresholdMinutes } = payload;

    // A. Calculate Scanned & Protected Metrics
    const allTabs = await chrome.tabs.query({});
    const totalScanned = allTabs.length;

    const unprotectedTabs = await getTabsToClean(protectedUrls);
    const tabsProtected = totalScanned - unprotectedTabs.length;

    // B. Run Cleanup Engine
    const { tabsToClose, duplicateCount } = getTabsToClose(
      unprotectedTabs,
      staleThresholdMinutes,
    );
    const tabsClosed = tabsToClose.length;

    if (tabsClosed === 0) {
      return { success: true, closedCount: 0 };
    }

    const closedTabsLog = [];
    const tabIdsToRemove: number[] = [];

    // C. Summarize & Log
    for (const tab of tabsToClose) {
      if (!tab.id) continue;
      tabIdsToRemove.push(tab.id);

      let summary = "Summary skipped (no API key provided).";
      if (hfApiKey && tab.url && tab.title) {
        summary = await summarizeTab(tab.id, tab.title, tab.url, hfApiKey);
      }

      closedTabsLog.push({
        title: tab.title || "Unknown Title",
        url: tab.url || "Unknown URL",
        summary: summary,
        closedAt: new Date().toISOString(),
      });
    }

    // D. Trigger JSON Download
    const fileContent = JSON.stringify(closedTabsLog, null, 2);
    const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(fileContent)}`;
    await chrome.downloads.download({
      url: dataUrl,
      filename: `tab-debt-ledger-${Date.now()}.json`,
      saveAs: false,
    });

    // E. Save Metrics & Open Summary Page
    const metrics = {
      totalScanned,
      tabsProtected,
      duplicateTabsClosed: duplicateCount,
      tabsClosed,
    };

    // Save to storage so the React frontend can read it
    await chrome.storage.local.set({ latestMetrics: metrics });

    // Open the summary page (we pass a query param so React knows what view to show)
    await chrome.tabs.create({
      url: chrome.runtime.getURL("index.html?view=summary"),
    });

    // F. Close the physical tabs
    await chrome.tabs.remove(tabIdsToRemove);

    return { success: true, metrics };
  } catch (error) {
    console.error("Tab Debt Cleanup Failed:", error);
    return { success: false, error: "Cleanup encountered an error." };
  }
}
