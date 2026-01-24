(function() {
  "use strict";

  // ====== CONFIG: your local proxy URL ======
  const PROXY_URL = "http://127.0.0.1:5000/sales-insight";

  // Simple UI wiring for standalone testing
  function setupStandaloneUI() {
    const input = document.getElementById("questionInput");
    const btn   = document.getElementById("askBtn");
    const box   = document.getElementById("answerBox");

    if (!input || !btn || !box) return;

    btn.addEventListener("click", async () => {
      const question = (input.value || "").trim();
      if (!question) {
        box.textContent = "Please enter a question.";
        return;
      }

      box.textContent = "Loading...";

      try {
        const resp = await fetch(PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question })
        });

        if (!resp.ok) {
          const text = await resp.text();
          box.textContent = "Error: " + text;
          return;
        }

        const data = await resp.json();
        box.textContent = data.answer || "(no answer)";
      } catch (e) {
        box.textContent = "Request failed: " + e.toString();
      }
    });
  }

  // If SAC custom widget runtime exists, wire into it
  function setupSACWidget() {
    if (!window["sap"] || !sap["bi"] || !sap.bi.wt) {
      // Not running in SAC – just standalone test mode
      setupStandaloneUI();
      return;
    }

    // Basic custom widget skeleton
    const getScriptInfo = () => {
      return {
        id: "pwc.sales.insight.widget",
        name: "Sales Widget",
        description: "Ask natural-language questions and get answers from a Databricks endpoint via a proxy."
      };
    };

    const widgetImpl = function() {
      const that = this;

      // Called once when widget is created
      this.init = function() {
        setupStandaloneUI(); // reuse the same UI logic
      };

      // Called when widget properties or data change
      this.afterUpdate = function() {
        // Example: you could take a default question from a property
        // and auto-call the proxy. For now we let the user type.
      };

      this.onResize = function() {
        // Optional: handle resize
      };

      this.destroy = function() {
        // Cleanup if needed
      };
    };

    sap.bi.wt.customWidgetManager
      .registerCustomWidget(getScriptInfo, widgetImpl);
  }

  // Run when DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupSACWidget);
  } else {
    setupSACWidget();
  }
})();
