class DatabricksUtilitiesGenAIWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

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
          min-height: 70px;
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
          background-color: #fafafa;
        }
        .status {
          font-size: 12px;
          color: #666;
        }
      </style>

      <div class="container">
        <textarea class="prompt" placeholder="Ask a utilities (IS-U) question..."></textarea>
        <button class="submit">Ask</button>
        <div class="status"></div>
        <div class="response"></div>
      </div>
    `;

    this.promptEl = this.shadowRoot.querySelector(".prompt");
    this.buttonEl = this.shadowRoot.querySelector(".submit");
    this.statusEl = this.shadowRoot.querySelector(".status");
    this.responseEl = this.shadowRoot.querySelector(".response");

    this.buttonEl.addEventListener("click", () => this.callUtilitiesGenAI());
  }

  connectedCallback() {
    this.statusEl.textContent = "Ready.";
  }

  async callUtilitiesGenAI() {
    const question = this.promptEl.value.trim();
    if (!question) {
      this.statusEl.textContent = "Please enter a question.";
      return;
    }

    this.statusEl.textContent = "Calling Utilities GenAI...";
    this.responseEl.textContent = "";

    const proxyUrl =
      this.getAttribute("proxyurl") ||
      "http://127.0.0.1:5000/utilities-insight";

    try {
      const resp = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      if (!resp.ok) {
        const text = await resp.text();
        this.statusEl.textContent = `Error: HTTP ${resp.status}`;
        this.responseEl.textContent = text;
        return;
      }

      const data = await resp.json();
      console.log("Utilities GenAI response:", data);

      const answer =
        typeof data.answer === "string"
          ? data.answer
          : "No readable answer returned.";

      this.statusEl.textContent = "Success.";
      this.responseEl.textContent = answer;

    } catch (err) {
      console.error(err);
      this.statusEl.textContent = "Network or JavaScript error.";
      this.responseEl.textContent = String(err);
    }
  }
}

customElements.define(
  "databricks-utilities-genai-widget",
  DatabricksUtilitiesGenAIWidget
);
