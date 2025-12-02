class DatabricksLLMWidget extends HTMLElement {
  constructor() {
    super();
    // Shadow DOM keeps our styles/UI isolated
    this.attachShadow({ mode: "open" });

    // Basic UI layout
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
        }
        button {
          padding: 6px 12px;
          cursor: pointer;
        }
        .response {
          flex: 1;
          border: 1px solid #ccc;
          padding: 8px;
          white-space: pre-wrap;
          overflow: auto;
          box-sizing: border-box;
        }
        .status {
          font-size: 12px;
          color: #666;
        }
      </style>
      <div class="container">
        <textarea class="prompt" placeholder="Enter your question or prompt..."></textarea>
        <button class="submit">Ask Databricks</button>
        <div class="status"></div>
        <div class="response"></div>
      </div>
    `;

    this.promptEl = this.shadowRoot.querySelector(".prompt");
    this.buttonEl = this.shadowRoot.querySelector(".submit");
    this.statusEl = this.shadowRoot.querySelector(".status");
    this.responseEl = this.shadowRoot.querySelector(".response");

    this.buttonEl.addEventListener("click", () => this.callDatabricks());
  }

  // Runs when the widget is created
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
    this.responseEl.textContent = "";

    // During local testing
    const endpointUrl = "http://127.0.0.1:5000/llm"; // change to HTTPS proxy when hosted

    try {
      const resp = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: prompt })
      });

      if (!resp.ok) {
        const text = await resp.text();
        this.statusEl.textContent = `Error: HTTP ${resp.status}`;
        this.responseEl.textContent = text;
        return;
      }

      const data = await resp.json();

      const output =
        data.output_text ||
        (data.predictions && data.predictions[0] && data.predictions[0].content) ||
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

customElements.define("databricks-llm-widget", DatabricksLLMWidget);
