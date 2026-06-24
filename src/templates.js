const path = require("path");
const {
  REACT_SAMPLE_CONFIG,
  REACT_JS_SAMPLE_CONFIG,
  REACT_TDS_SAMPLE_CONFIG,
  JS_SAMPLE_CONFIG,
  TS_SAMPLE_CONFIG,
} = require("./sample-configs");

const TEMPLATES_DIR = path.resolve(__dirname, "..", "templates");

const TEMPLATE_IDS = ["react-ts", "react", "js", "ts"];

const TEMPLATE_REGISTRY = {
  "react-ts": {
    appFile: "src/App.tsx",
    isVanilla: false,
    isTypeScript: true,
    useTds: false,
    sampleConfig: REACT_SAMPLE_CONFIG,
  },
  react: {
    appFile: "src/App.jsx",
    isVanilla: false,
    isTypeScript: false,
    useTds: false,
    sampleConfig: REACT_JS_SAMPLE_CONFIG,
  },
  "react-ts-tds": {
    appFile: "src/App.tsx",
    isVanilla: false,
    isTypeScript: true,
    useTds: true,
    sampleConfig: REACT_TDS_SAMPLE_CONFIG,
  },
  js: {
    appFile: "src/app.js",
    isVanilla: true,
    isTypeScript: false,
    useTds: false,
    sampleConfig: JS_SAMPLE_CONFIG,
  },
  ts: {
    appFile: "src/app.ts",
    isVanilla: true,
    isTypeScript: true,
    useTds: false,
    sampleConfig: TS_SAMPLE_CONFIG,
  },
};

const SAMPLE_PRIMARY_COLOR = [
  "#FF8A65",
  "#FD9B3C",
  "#E0B20C",
  "#3FD599",
  "#81C784",
  "#4DB6AC",
  "#4DD0E1",
  "#64B5F6",
  "#655DFF",
  "#9575CD",
  "#BA68C8",
  "#FF91D5",
  "#F06292",
  "#D7B59E",
];

const TEMPLATE_CHOICES = [
  { name: "react-ts — React + TypeScript (기본)", value: "react-ts" },
  { name: "react — React + JavaScript", value: "react" },
  { name: "js — Vanilla JavaScript", value: "js" },
  { name: "ts — Vanilla TypeScript", value: "ts" },
];

function resolveTemplateFolder(baseTemplateId, useTds) {
  if (baseTemplateId === "react-ts" && useTds) return "react-ts-tds";
  return baseTemplateId;
}

module.exports = {
  TEMPLATES_DIR,
  TEMPLATE_IDS,
  TEMPLATE_REGISTRY,
  TEMPLATE_CHOICES,
  SAMPLE_PRIMARY_COLOR,
  resolveTemplateFolder,
};
