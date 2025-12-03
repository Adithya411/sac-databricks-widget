class DatabricksLLMWidget extends HTMLElement {
  constructor() {
    super();
    // Shadow DOM keeps styles/UI isolated
    this.attachShadow({ mode: "open" });

    // UI layout
    this.shadowRoot.innerHTML = `
      <style>
        .container {
          font-family: Arial, sans-serif;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          height: 100%;
          box-sizing: border-box;
        }
        textarea {
          width: 100%;
          min-height: 80px;
          resize: vertical;
          box-sizing: border-box;
          font-size: 14px;
          padding: 6px;
        }
        button {
          padding: 6px 12px;
          cursor: pointer;
          font-size: 14px;
        }
        .response {
          flex: 1;
          border: 1px solid #ccc;
          padding: 8px;
          white-space: pre-wrap;
          overflow: auto;
          box-sizing: border-box;
          background: #f9f9f9;
        }
        .status {
          font-size: 12px;
          color: #666;
        }
      </style>
      <div class="container">
        <textarea class="prompt" placeholder="Enter your question or prompt..."></textarea>
        <button class="submit">Ask Databricks</button>
        <div class="status">Ready.</div>
        <div class="response"></div>
      </div>
    `;

    // DOM references
    this.promptEl = this.shadowRoot.querySelector(".prompt");
    this.buttonEl = this.shadowRoot.querySelector(".submit");
    this.statusEl = this.shadowRoot.querySelector(".status");
    this.responseEl = this.shadowRoot.querySelector(".response");

    // Event
    this.buttonEl.addEventListener("click", () => this.callDatabricks());
  }

  // Runs when the widget is added to DOM
  connectedCallback() {
    this.statusEl.textContent = "Ready.";
  }

  // Call Databricks proxy endpoint
  async callDatabricks() {
    const prompt = this.promptEl.value.trim();
    if (!prompt) {
      this.statusEl.textContent = "Please enter a prompt.";
      return;
    }

    this.statusEl.textContent = "Calling Databricks...";
    this.responseEl.textContent = "";

    // Change this to your hosted endpoint or ngrok URL in production
    const endpointUrl = "http://127.0.0.1:5000/llm";

    try {
      const resp = await fetch(endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (!resp.ok) {
        const text = await resp.text();
        this.statusEl.textContent = `Error: HTTP ${resp.status}`;
        this.responseEl.textContent = text;
        return;
      }

      const data = await resp.json();

      // Handle different possible response structures
      const output =
        data.insights ||
        data.output_text ||
        (data.predictions && data.predictions[0]?.content) ||
        JSON.stringify(data, null, 2);

      this.statusEl.textContent = "Success.";
      this.responseEl.textContent = output;
    } catch (err) {
      console.error(err);
      this.statusEl.textContent = "Network or JS error.";
      this.responseEl.textContent = String(err);
    }
  }
}

// Register custom element
customElements.define("databricks-llm-widget", DatabricksLLMWidget);
