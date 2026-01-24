(function () {
  "use strict";

  // ---- Widget metadata ----
  const getScriptInfo = () => ({
    id: "pwc.sales.insight.widget",
    name: "Sales Insight Widget",
    description: "Ask sales questions and get answers from a Databricks GenAI endpoint"
  });

  // ---- Widget implementation ----
  const widgetImpl = function () {
    let input;
    let button;
    let output;

    this.init = function () {
      // Main container
      const container = document.createElement("div");
      container.style.padding = "10px";
      container.style.fontFamily = "Arial, sans-serif";

      // Input box
      input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Ask a sales question…";
      input.style.width = "100%";
      input.style.marginBottom = "8px";

      // Button
      button = document.createElement("button");
      button.innerText = "Ask";
      button.style.padding = "6px 12px";

      // Output area
      output = document.createElement("div");
      output.style.marginTop = "10px";
      output.style.whiteSpace = "pre-wrap";

      button.onclick = async () => {
        const question = input.value.trim();
        if (!question) {
          output.innerText = "Please enter a question.";
          return;
        }

        const proxyUrl = this.getProperty("proxyUrl");

        if (!proxyUrl) {
          output.innerText = "Proxy URL is not configured.";
          return;
        }

        output.innerText = "Loading…";

        try {
          const resp = await fetch(proxyUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ question: question })
          });

          if (!resp.ok) {
            const text = await resp.text();
            output.innerText = "Error: " + text;
            return;
          }

          const data = await resp.json();
          output.innerText = data.answer || "No answer returned.";

        } catch (err) {
          console.error(err);
          output.innerText = "Failed to call backend service.";
        }
      };

      // Assemble UI
      container.appendChild(input);
      container.appendChild(button);
      container.appendChild(output);

      // Attach to SAC widget container
      this.append(container);
    };

    this.afterUpdate = function () {
      // Called when properties change (optional)
    };

    this.onResize = function () {
      // Optional resize handling
    };

    this.destroy = function () {
      // Cleanup if needed
    };
  };

  // ---- Register widget with SAC ----
  if (window.sap && sap.bi && sap.bi.wt && sap.bi.wt.customWidgetManager) {
    sap.bi.wt.customWidgetManager.registerCustomWidget(
      getScriptInfo,
      widgetImpl
    );
  } else {
    console.error("SAC customWidgetManager not available.");
  }
})();
