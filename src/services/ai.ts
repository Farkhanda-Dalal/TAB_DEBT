async function extractTextFromTab(tabId: number): Promise<string> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => document.body.innerText.replace(/\s+/g, ' ').substring(0, 1500)
    });
    return results[0]?.result || "No content extracted.";
  } catch {
    // Fails safely on restricted URLs like chrome:// or the Chrome Web Store
    return "Failed to extract content (restricted page).";
  }
}

export async function summarizeTab(tabId: number, title: string, url: string, hfApiKey: string): Promise<string> {
  const pageText = await extractTextFromTab(tabId);
  
  const prompt = `Summarize this webpage in one short, concise sentence.
Title: ${title}
URL: ${url}
Content: ${pageText}
Summary:`;

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/google/gemma-2-2b-it", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 50, return_full_text: false }
      })
    });

    if (!response.ok) throw new Error("API failed or rate limited");
    
    const data = await response.json();
    return data[0]?.generated_text?.trim() || "Saved for later review.";
  } catch  {
    return "Saved for later review.";
  }
}