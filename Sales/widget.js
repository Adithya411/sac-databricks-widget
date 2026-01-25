class DatabricksSalesGenAIWidget extends HTMLElement {
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
          box-sizing: border-box;
          background-color: #fafafa;
        }
        .status {
          font-size: 12px;
          color: #666;
        }
      </style>

      <div class="container">
        <textarea class="prompt" placeholder="Ask a sales or forecast question..."></textarea>
        <button class="submit">Ask</button>
        <div class="status"></div>
        <div class="response"></div>
      </div>
    `;

    this.promptEl = this.shadowRoot.querySelector(".prompt");
    this.buttonEl = this.shadowRoot.querySelector(".submit");
    this.statusEl = this.shadowRoot.querySelector(".status");
    this.responseEl = this.shadowRoot.querySelector(".response");

    this.buttonEl.addEventListener("click", () => this.callSalesGenAI());
  }

  connectedCallback() {
    this.statusEl.textContent = "Ready.";
  }

  async callSalesGenAI() {
    const question = this.promptEl.value.trim();
    if (!question) {
      this.statusEl.textContent = "Please enter a question.";
      return;
    }

    this.statusEl.textContent = "Calling Databricks GenAI endpoint...";
    this.responseEl.textContent = "";

    // 🔹 IMPORTANT: Use the SAC-configured proxyUrl property
    const proxyUrl =
      this.getAttribute("proxyurl") ||
      "http://127.0.0.1:5000/sales-insight";

    try {
      const resp = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          dataframe_split: {
            columns: ["user_query"],
            data: [[question]]
          }
        })
      });

      if (!resp.ok) {
        const text = await resp.text();
        this.statusEl.textContent = `Error: HTTP ${resp.status}`;
        this.responseEl.textContent = text;
        return;
      }

      const data = await resp.json();

      // 🔹 THIS IS THE KEY DIFFERENCE FROM FORECAST WIDGET
      const answer =
        data.predictions &&
        Array.isArray(data.predictions) &&
        data.predictions.length > 0
          ? data.predictions[0]
          : "No answer returned by the model.";

      this.statusEl.textContent = "Success.";
      this.responseEl.textContent = answer;

    } catch (err) {
      console.error(err);
      this.statusEl.textContent = "Network or JavaScript error.";
      this.responseEl.textContent = String(err);
    }
  }
}

// 🔹 Register Web Component
customElements.define(
  "databricks-sales-genai-widget",
  DatabricksSalesGenAIWidget
);
