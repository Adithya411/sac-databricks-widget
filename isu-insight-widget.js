class ISUInsightWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // Basic UI (similar look to your HTML mock-up)
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
        .row {
          display: flex;
          gap: 8px;
        }
        input.question {
          flex: 1;
          padding: 6px;
          box-sizing: border-box;
        }
        button.ask {
          padding: 6px 12px;
          cursor: pointer;
        }
        .status {
          font-size: 12px;
          color: #666;
        }
        .answer {
          flex: 1;
          border: 1px solid #ccc;
          padding: 8px;
          white-space: pre-wrap;
          overflow: auto;
          box-sizing: border-box;
          min-height: 60px;
        }
      </style>
      <div class="container">
        <div class="row">
          <input class="question" type="text"
                 placeholder="Enter your question...">
          <button class="ask">Ask</button>
        </div>
        <div class="status">Ready.</div>
        <div class="answer">Answer will appear here.</div>
      </div>
    `;

    this.questionEl = this.shadowRoot.querySelector(".question");
    this.buttonEl   = this.shadowRoot.querySelector(".ask");
    this.statusEl   = this.shadowRoot.querySelector(".status");
    this.answerEl   = this.shadowRoot.querySelector(".answer");

    this.buttonEl.addEventListener("click", () => this.callProxy());
  }

  connectedCallback() {
    // Read defaultQuestion / proxyUrl from SAC properties if present
    const defaultQuestion = this.getAttribute("defaultQuestion") || "";
    if (defaultQuestion) {
      this.questionEl.value = defaultQuestion;
    }
  }

  /**
   * Helper to get the proxy URL:
   * 1) attribute "proxyUrl" from SAC properties if set
   * 2) fallback to local dev URL
   */
  getProxyUrl() {
    const attr = this.getAttribute("proxyUrl");
    if (attr && attr.trim() !== "") {
      return attr.trim();
    }
    // Local dev fallback – same as you used before
    return "http://127.0.0.1:5000/isu-insight";
  }

  async callProxy() {
    const question = this.questionEl.value.trim();
    if (!question) {
      this.statusEl.textContent = "Please enter a question.";
      return;
    }

    const endpointUrl = this.getProxyUrl();
    this.statusEl.textContent = "Calling ISU Databricks endpoint...";
    this.answerEl.textContent = "";

    try {
      const resp = await fetch(endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      if (!resp.ok) {
        const text = await resp.text();
        this.statusEl.textContent = `Error: HTTP ${resp.status}`;
        this.answerEl.textContent = text;
        return;
      }

      const data = await resp.json();

      // Your proxy returns: { "answer": "..." }
      const answer = data.answer ||
                     data.output_text ||
                     JSON.stringify(data, null, 2);

      this.statusEl.textContent = "Success.";
      this.answerEl.textContent = answer;
    } catch (err) {
      console.error(err);
      this.statusEl.textContent = "Network or JS error.";
      this.answerEl.textContent = String(err);
    }
  }
}

// Tag must match the JSON "tag"
customElements.define("isu-insight-widget", ISUInsightWidget);
