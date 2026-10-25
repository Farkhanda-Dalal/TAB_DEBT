import { getTabsToClean } from "./tabs";
import { getTabsToClose } from "./cleanup";
import { summarizeTab } from "./ai";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "CLEANUP_NOW") {
    runCleanupCycle().then(sendResponse);
    return true;
  }
});

async function runCleanupCycle() {
  try {
    // 1. Read frontend's storage contract
    const storage = await chrome.storage.local.get([
      "tabDebt.protectedUrls",
      "tabDebt.savedNotes",
    ]);

    // Map her ProtectedUrl objects to a simple array of string URLs for our engine
    const protectedUrlObjects = (storage["tabDebt.protectedUrls"] ||
      []) as Array<{ url: string }>;
    const protectedUrls = protectedUrlObjects.map(
      (p: { url: string }) => p.url,
    );

    // Hardcoding the API key and threshold for now since the UI doesn't send them yet
    const hfApiKey = import.meta.env.VITE_HF_API_KEY; // TODO: Add your Hugging Face API key here for testing
    console.log("[Tab Debt] HF API key loaded:", Boolean(hfApiKey));
console.log("[Tab Debt] HF API key length:", hfApiKey?.length ?? 0);
    const staleThresholdMinutes = 1440; // 24 hours

    // 2. Calculate Scanned & Protected Metrics
    const allTabs = await chrome.tabs.query({});
    const totalTabsScanned = allTabs.length;

    const unprotectedTabs = await getTabsToClean(protectedUrls);
    const protectedTabsSkipped = totalTabsScanned - unprotectedTabs.length;

    // 3. Run Cleanup Engine
    const { tabsToClose, duplicateCount } = getTabsToClose(
      unprotectedTabs,
      staleThresholdMinutes,
    );

    if (tabsToClose.length === 0) {
      return {
        success: true,
        metrics: {
          totalTabsScanned,
          duplicateTabsClosed: 0,
          protectedTabsSkipped,
        },
      };
    }

    const newNotes = [];
    const tabIdsToRemove: number[] = [];

    // 4. Summarize and format to frontend's SavedNote structure
    for (const tab of tabsToClose) {
      if (!tab.id) continue;
      tabIdsToRemove.push(tab.id);

      let summary = "Summary skipped (no API key).";
      if (hfApiKey && tab.url && tab.title) {
        summary = await summarizeTab(tab.id, tab.title, tab.url, hfApiKey);
      }

      newNotes.push({
        id: crypto.randomUUID(),
        title: tab.title || "Unknown Title",
        url: tab.url || "Unknown URL",
        summary: summary,
        savedAt: Date.now(),
      });
    }

    // 5. Save notes back to storage for SavedNotesList.tsx to render
    const existingNotes = (storage["tabDebt.savedNotes"] || []) as Array<{
      id: string;
      title: string;
      url: string;
      summary: string;
      savedAt: number;
    }>;
    await chrome.storage.local.set({
      "tabDebt.savedNotes": [...existingNotes, ...newNotes],
    });

    // ADD THIS BLOCK TO TRIGGER THE DOWNLOAD
    const fileContent = JSON.stringify(newNotes, null, 2);
    const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(fileContent)}`;
    await chrome.downloads.download({
      url: dataUrl,
      filename: `tab-debt-ledger-${Date.now()}.json`,
      saveAs: false,
    });

    // 6. Close the physical tabs
    await chrome.tabs.remove(tabIdsToRemove);

    // 6. Close the physical tabs
    await chrome.tabs.remove(tabIdsToRemove);

    // 7. Return exact metrics contract to the UI
    return {
      success: true,
      metrics: {
        totalTabsScanned,
        duplicateTabsClosed: duplicateCount,
        protectedTabsSkipped,
      },
    };
  } catch (error) {
    console.error("Tab Debt Cleanup Failed:", error);
    return { success: false, error: "Cleanup encountered an error." };
  }
}
