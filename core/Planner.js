export class Planner {
  constructor() {
    this.version = "2.0.0";

    this.intentRules = [
      {
        intent: "READ",
        patterns: ["اقرأ", "اقري", "read", "show", "اعرض"]
      },
      {
        intent: "SEARCH",
        patterns: ["ابحث", "بحث", "search", "find", "وين موجود"]
      },
      {
        intent: "CREATE",
        patterns: ["أنشئ", "انشئ", "إنشاء", "create", "build", "make"]
      },
      {
        intent: "MODIFY",
        patterns: [
          "عدل", "عدّل", "غير", "غيّر", "طور", "طوّر",
          "حسن", "حسّن", "fix", "edit", "modify", "implement"
        ]
      },
      {
        intent: "DEBUG",
        patterns: [
          "اصلح", "أصلح", "صلح", "خطأ", "غلط",
          "error", "bug", "debug"
        ]
      },
      {
        intent: "TEST",
        patterns: ["اختبر", "اختبار", "test", "tests", "check"]
      }
    ];
  }

  normalize(text) {
    return String(text || "")
      .trim()
      .replace(/\s+/g, " ");
  }

  detectIntents(text) {
    const lower = text.toLowerCase();
    const intents = [];

    for (const rule of this.intentRules) {
      if (
        rule.patterns.some(pattern =>
          lower.includes(pattern.toLowerCase())
        )
      ) {
        intents.push(rule.intent);
      }
    }

    return intents;
  }

  extractFiles(text) {
    const matches =
      text.match(
        /(?:[\w.-]+\/)*[\w.-]+\.(?:js|mjs|cjs|ts|tsx|jsx|json|py|java|kt|go|rs|cpp|c|html|css|md|yml|yaml|sh)/gi
      ) || [];

    return [...new Set(matches)];
  }

  extractReadTarget(text) {
    const match = text.match(
      /(?:اقرأ|اقري|read)\s+([^\s]+)/i
    );

    return match ? match[1] : null;
  }

  extractSearchQuery(text) {
    const match = text.match(
      /(?:ابحث|بحث|search|find)\s+(.+)/i
    );

    return match ? match[1].trim() : null;
  }

  createAction(type, data = {}) {
    return {
      type,
      ...data
    };
  }

  classifyRisk(intents) {
    if (
      intents.includes("MODIFY") ||
      intents.includes("DEBUG") ||
      intents.includes("CREATE")
    ) {
      return "WRITE";
    }

    if (intents.includes("SHELL")) {
      return "SHELL";
    }

    return "READ_ONLY";
  }

  createPlan(prompt) {
    const text = this.normalize(prompt);

    if (!text) {
      return [];
    }

    const intents = this.detectIntents(text);
    const files = this.extractFiles(text);
    const actions = [];

    const risk = this.classifyRisk(intents);

    /*
     * Every task starts with repository awareness.
     */
    actions.push(
      this.createAction("REPOSITORY_MAP")
    );

    /*
     * Inspect explicitly referenced files first.
     */
    for (const file of files) {
      actions.push(
        this.createAction("FILE_EXISTS", {
          target: file
        })
      );
    }

    /*
     * Read operation.
     */
    if (intents.includes("READ")) {
      const target =
        this.extractReadTarget(text) || files[0];

      if (target) {
        actions.push(
          this.createAction("READ", {
            target
          })
        );
      }
    }

    /*
     * Search operation.
     */
    if (intents.includes("SEARCH")) {
      const query = this.extractSearchQuery(text);

      if (query) {
        actions.push(
          this.createAction("SEARCH", {
            query
          })
        );
      }
    }

    /*
     * Coding tasks receive deeper analysis.
     */
    if (
      intents.includes("CREATE") ||
      intents.includes("MODIFY") ||
      intents.includes("DEBUG")
    ) {
      actions.push(
        this.createAction("ANALYZE_TASK", {
          prompt: text,
          intents,
          files
        })
      );

      actions.push(
        this.createAction("DEPENDENCY_SCAN", {
          files
        })
      );
    }

    /*
     * Tests are planned explicitly.
     */
    if (
      intents.includes("TEST") ||
      intents.includes("MODIFY") ||
      intents.includes("DEBUG") ||
      intents.includes("CREATE")
    ) {
      actions.push(
        this.createAction("VERIFY_CODE", {
          files
        })
      );
    }

    /*
     * Final planning metadata.
     */
    actions.push(
      this.createAction("PLAN_SUMMARY", {
        intents,
        files,
        risk,
        version: this.version
      })
    );

    return [
      {
        step: 1,
        action: "UNDERSTAND",
        description:
          "Understand the task, intent, scope, and risk."
      },
      {
        step: 2,
        action: "INSPECT",
        description:
          "Inspect the repository and referenced files."
      },
      {
        step: 3,
        action: "ANALYZE",
        description:
          "Analyze dependencies and affected areas.",
        actions
      },
      {
        step: 4,
        action: "IMPLEMENT",
        description:
          "Execute only validated actions required by the task."
      },
      {
        step: 5,
        action: "VERIFY",
        description:
          "Validate the result and detect regressions."
      }
    ];
  }
}
