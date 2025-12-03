class DatabricksMetaWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `
      <style>
        .container { font-family: Arial, sans-serif; padding: 8px; display: flex; flex-direction: column; gap: 8px; height: 100%; box-sizing: border-box; }
        textarea { width: 100%; min-height: 80px; resize: vertical; box-sizing: border-box; font-size: 14px; padding: 6px; }
        button { padding: 8px 12px; cursor: pointer; font-size: 14px; background-color: #007cc0; border: none; color: white; border-radius: 4px; transition: background-color 0.2s ease; }
        button:hover { background-color: #005a8c; }
        .response { flex: 1; border: 1px solid #ccc; padding: 8px; white-space: pre-wrap; overflow: auto; box-sizing: border-box; background-color: #f9f9f9; font-family: monospace; font-size: 13px; margin-top: 8px; border-radius: 4px; }
        .status { font-size: 12px; color: #666; min-height: 18px; margin-top: 4px; }
      </style>
      <div class="container">
        <textarea class="prompt" placeholder="Enter your question or prompt..."></textarea>
        <button class="submit">Ask Databricks</button>
        <div class="status">Ready.</div>
        <div class="response">Your output will appear here.</div>
      </div>
    `;

    this.promptEl = this.shadowRoot.querySelector(".prompt");
    this.buttonEl = this.shadowRoot.querySelector(".submit");
    this.statusEl = this.shadowRoot.querySelector(".status");
    this.responseEl = this.shadowRoot.querySelector(".response");

    this.buttonEl.addEventListener("click", () => this.callDatabricks());
  }

  get proxyUrl() {
    return this.getAttribute("proxyUrl") || "http://127.0.0.1:5000/llm"; // default for local dev
  }

  set proxyUrl(value) {
    this.setAttribute("proxyUrl", value);
  }

  connectedCallback() {
    this.statusEl.textContent = "Ready.";
  }

  async callDatabricks() {
    const prompt = this.promptEl.value.trim();
    if (!prompt) {
      this.statusEl.textContent = "Please enter a prompt.";
      return;
    }

    this.statusEl.textContent = "Calling Databricks...";
    this.responseEl.textContent = "...";

    try {
      const resp = await fetch(this.proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (!resp.ok) {
        const text = await resp.text();
        this.statusEl.textContent = `Error: HTTP ${resp.status}`;
        this.responseEl.textContent = text || "No response body";
        return;
      }

      const data = await resp.json();
      const output =
        data.output_text ||
        (data.predictions && data.predictions[0]?.content) ||
        JSON.stringify(data, null, 2);

      this.statusEl.textContent = "Success.";
      this.responseEl.textContent = output || "(empty response)";
    } catch (err) {
      console.error(err);
      this.statusEl.textContent = "Network or JS error.";
      this.responseEl.textContent = err.message || String(err);
    }
  }
}

customElements.define("databricks-meta-widget", DatabricksMetaWidget);
