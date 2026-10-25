async function extractTextFromTab(tabId: number): Promise<string> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () =>
        document.body.innerText.replace(/\s+/g, " ").substring(0, 1000), // Reduced to 1000 to prevent payload too large errors
    });
    return results[0]?.result || "No content extracted.";
  } catch (err) {
    console.warn("Could not extract text from tab:", err);
    return "Failed to extract content.";
  }
}

export async function summarizeTab(
  tabId: number,
  title: string,
  url: string,
  hfApiKey: string,
): Promise<string> {
  const pageText = await extractTextFromTab(tabId);

  // Gemma-2 MUST use this exact formatting
  const prompt = `<start_of_turn>user\nWrite a single, concise sentence summarizing this webpage content. Do not use quotes or formatting. Title: ${title}. Content: ${pageText}<end_of_turn>\n<start_of_turn>model\n`;

  try {
    console.log(`[Tab Debt] Sending request to Gemma for tab: ${title}`);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/gemma-2-2b-it",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 60,
            return_full_text: false,
            temperature: 0.1,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[Tab Debt] HF API Error Response:",
        response.status,
        errorText,
      );
      return `API Error ${response.status}: ${errorText.substring(0, 50)}...`;
    }

    const data = await response.json();
    console.log("[Tab Debt] Gemma Response:", data);
    return (
      data[0]?.generated_text?.trim() || "Gemma returned an empty summary."
    );
  } catch (error) {
    // This will now show us the exact network or parse error
    console.error("[Tab Debt] Fetch Exception:", error);
    return `Exception: ${error instanceof Error ? error.message : String(error)}`;
  }
}
