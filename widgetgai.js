class DatabricksMetaWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `
      <style>
        .container { font-family: Arial; display:flex; flex-direction:column; gap:8px; height:100%; }
        textarea { width:100%; min-height:80px; }
        button { padding:6px 12px; cursor:pointer; }
        .status { font-size:12px; color:#666; min-height:18px; }
        .response { flex:1; border:1px solid #ccc; padding:8px; white-space:pre-wrap; overflow:auto; }
      </style>
      <div class="container">
        <textarea class="prompt" placeholder="Enter your question..."></textarea>
        <button class="submit">Ask Databricks</button>
        <div class="status">Ready.</div>
        <div class="response"></div>
      </div>
    `;

    this.promptEl = this.shadowRoot.querySelector(".prompt");
    this.buttonEl = this.shadowRoot.querySelector(".submit");
    this.statusEl = this.shadowRoot.querySelector(".status");
    this.responseEl = this.shadowRoot.querySelector(".response");

    this.buttonEl.addEventListener("click", () => this.callDatabricks());
  }

  connectedCallback() {
    this.statusEl.textContent = "Ready.";
  }

  get proxyUrl() {
    return (
      this.getAttribute("proxyUrl") ||
      "http://127.0.0.1:5000/billing-insights"
    );
  }

  async callDatabricks() {
    const prompt = this.promptEl.value.trim();
    if (!prompt) {
      this.statusEl.textContent = "Please enter a prompt.";
      return;
    }

    this.statusEl.textContent = "Calling Databricks...";
    this.responseEl.textContent = "";

    try {
      const resp = await fetch(this.proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        this.statusEl.textContent = `Error: HTTP ${resp.status}`;
        this.responseEl.textContent = errorText;
        return;
      }

      const data = await resp.json();
      this.statusEl.textContent = "Success.";
      this.responseEl.textContent = data.output_text || JSON.stringify(data, null, 2);

    } catch (err) {
      this.statusEl.textContent = "Network/JS error";
      this.responseEl.textContent = err.message || String(err);
    }
  }
}

customElements.define("databricks-meta-widget", DatabricksMetaWidget);
