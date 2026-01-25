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

    const proxyUrl =
      this.getAttribute("proxyurl") ||
      "http://127.0.0.1:5000/sales-insight";

    try {
      const resp = await fetch(proxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      console.log("🔍 RAW DATABRICKS RESPONSE:", data);

      let answer = null;

      // ---- HANDLE ALL KNOWN DATABRICKS GENAI FORMATS ----
      if (typeof data === "string") {
        answer = data;
      }
      else if (data.output_text) {
        answer = data.output_text;
      }
      else if (data.result) {
        answer = data.result;
      }
      else if (Array.isArray(data.predictions)) {
        const p0 = data.predictions[0];

        if (typeof p0 === "string") {
          answer = p0;
        }
        else if (Array.isArray(p0) && typeof p0[0] === "string") {
          answer = p0[0];
        }
        else if (typeof p0 === "object") {
          answer =
            p0.content ||
            p0.answer ||
            p0.text ||
            JSON.stringify(p0, null, 2);
        }
      }

      if (!answer) {
        answer =
          "No readable answer returned.\n\nRaw response:\n" +
          JSON.stringify(data, null, 2);
      }

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
  "databricks-sales-genai-widget",
  DatabricksSalesGenAIWidget
);
