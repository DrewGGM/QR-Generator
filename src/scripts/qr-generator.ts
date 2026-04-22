import QRCodeStyling, {
  type Options,
  type DotType,
  type CornerSquareType,
  type CornerDotType,
  type ErrorCorrectionLevel,
  type FileExtension,
} from "qr-code-styling";
import { templates, colorPalettes, type StylePreset } from "../data/templates";

interface State {
  templateId: string;
  data: Record<string, string>;
  style: StylePreset;
  size: number;
  margin: number;
  logo: string | null;
  logoSize: number;
  hideBackgroundDots: boolean;
}

const root = document.getElementById("qr-app");
if (!root) throw new Error("#qr-app not found");

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector(sel) as T;
const $$ = <T extends HTMLElement = HTMLElement>(sel: string) => Array.from(root.querySelectorAll(sel)) as T[];

const initialTemplate = templates[0];
const state: State = {
  templateId: initialTemplate.id,
  data: { url: "https://qr-permanente.pages.dev" },
  style: { ...initialTemplate.preset },
  size: 300,
  margin: 8,
  logo: null,
  logoSize: 0.32,
  hideBackgroundDots: true,
};

const qrContainer = $<HTMLDivElement>("#qr-preview");

function buildOptions(): Partial<Options> {
  const tpl = templates.find((t) => t.id === state.templateId)!;
  const data = tpl.encode(state.data) || " ";

  const dotsOptions: Options["dotsOptions"] = state.style.dotsGradient
    ? {
        type: state.style.dotsType as DotType,
        gradient: {
          type: state.style.dotsGradient.type,
          rotation: 0,
          colorStops: [
            { offset: 0, color: state.style.dotsGradient.from },
            { offset: 1, color: state.style.dotsGradient.to },
          ],
        },
      }
    : { type: state.style.dotsType as DotType, color: state.style.dotsColor };

  return {
    width: state.size,
    height: state.size,
    type: "svg",
    data,
    margin: state.margin,
    qrOptions: { errorCorrectionLevel: state.style.errorCorrection as ErrorCorrectionLevel },
    image: state.logo ?? undefined,
    dotsOptions,
    cornersSquareOptions: {
      type: state.style.cornersSquareType as CornerSquareType,
      color: state.style.cornersColor,
    },
    cornersDotOptions: {
      type: state.style.cornersDotType as CornerDotType,
      color: state.style.cornersColor,
    },
    backgroundOptions: { color: state.style.backgroundColor },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 6,
      imageSize: state.logoSize,
      hideBackgroundDots: state.hideBackgroundDots,
    },
  };
}

const qrCode = new QRCodeStyling(buildOptions());
qrCode.append(qrContainer);

function render() {
  qrCode.update(buildOptions());
}

// === FIELDS RENDERING ===
const fieldsContainer = $<HTMLDivElement>("#fields");
function renderFields() {
  const tpl = templates.find((t) => t.id === state.templateId)!;
  fieldsContainer.innerHTML = "";
  tpl.fields.forEach((f) => {
    const wrap = document.createElement("div");
    let inputHtml = "";
    const value = state.data[f.key] ?? "";
    const safeVal = value.replace(/"/g, "&quot;");
    if (f.type === "textarea") {
      inputHtml = `<textarea class="field min-h-[90px] resize-y" data-key="${f.key}" placeholder="${f.placeholder ?? ""}" ${f.required ? "required" : ""}>${value}</textarea>`;
    } else if (f.type === "select") {
      const opts = (f.options ?? [])
        .map((o) => `<option value="${o.value}" ${o.value === value ? "selected" : ""}>${o.label}</option>`)
        .join("");
      inputHtml = `<select class="field" data-key="${f.key}">${opts}</select>`;
    } else {
      inputHtml = `<input type="${f.type}" class="field" data-key="${f.key}" placeholder="${f.placeholder ?? ""}" value="${safeVal}" ${f.required ? "required" : ""}/>`;
    }
    wrap.innerHTML = `
      <label class="label">${f.label}${f.required ? ' <span class="text-rose-500">*</span>' : ""}</label>
      ${inputHtml}
      ${f.help ? `<p class="mt-1 text-xs text-slate-500">${f.help}</p>` : ""}
    `;
    fieldsContainer.appendChild(wrap);
  });

  fieldsContainer.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[data-key]").forEach((el) => {
    el.addEventListener("input", () => {
      state.data[el.dataset.key!] = el.value;
      render();
    });
  });
}

// === TEMPLATES ===
function selectTemplate(id: string, applyPreset = true) {
  const tpl = templates.find((t) => t.id === id);
  if (!tpl) return;
  state.templateId = id;
  state.data = {};
  tpl.fields.forEach((f) => {
    if (f.type === "select" && f.options?.length) state.data[f.key] = f.options[0].value;
    else state.data[f.key] = "";
  });
  if (applyPreset) {
    state.style = { ...tpl.preset };
    syncStyleControls();
  }
  $$<HTMLButtonElement>("[data-template]").forEach((b) => {
    b.classList.toggle("active", b.dataset.template === id);
  });
  renderFields();
  render();
}

$$<HTMLButtonElement>("[data-template]").forEach((b) => {
  b.addEventListener("click", () => selectTemplate(b.dataset.template!));
});

// === STYLE CONTROLS ===
function syncStyleControls() {
  ($("#dots-type") as HTMLSelectElement).value = state.style.dotsType;
  ($("#corners-square-type") as HTMLSelectElement).value = state.style.cornersSquareType;
  ($("#corners-dot-type") as HTMLSelectElement).value = state.style.cornersDotType;
  ($("#dots-color") as HTMLInputElement).value = state.style.dotsColor;
  ($("#corners-color") as HTMLInputElement).value = state.style.cornersColor;
  ($("#bg-color") as HTMLInputElement).value = state.style.backgroundColor;
  ($("#error-level") as HTMLSelectElement).value = state.style.errorCorrection;
  ($("#use-gradient") as HTMLInputElement).checked = !!state.style.dotsGradient;
  ($("#gradient-from") as HTMLInputElement).value = state.style.dotsGradient?.from ?? state.style.dotsColor;
  ($("#gradient-to") as HTMLInputElement).value = state.style.dotsGradient?.to ?? state.style.dotsColor;
  ($("#gradient-type") as HTMLSelectElement).value = state.style.dotsGradient?.type ?? "linear";
  toggleGradientUI();
}

function toggleGradientUI() {
  const on = ($("#use-gradient") as HTMLInputElement).checked;
  $("#gradient-options").classList.toggle("hidden", !on);
  $("#dots-color-wrap").classList.toggle("hidden", on);
}

const styleBindings: { sel: string; apply: (v: string) => void }[] = [
  { sel: "#dots-type", apply: (v) => (state.style.dotsType = v as StylePreset["dotsType"]) },
  { sel: "#corners-square-type", apply: (v) => (state.style.cornersSquareType = v as StylePreset["cornersSquareType"]) },
  { sel: "#corners-dot-type", apply: (v) => (state.style.cornersDotType = v as StylePreset["cornersDotType"]) },
  { sel: "#dots-color", apply: (v) => (state.style.dotsColor = v) },
  { sel: "#corners-color", apply: (v) => (state.style.cornersColor = v) },
  { sel: "#bg-color", apply: (v) => (state.style.backgroundColor = v) },
  { sel: "#error-level", apply: (v) => (state.style.errorCorrection = v as StylePreset["errorCorrection"]) },
];

styleBindings.forEach(({ sel, apply }) => {
  $(sel).addEventListener("input", (e) => {
    apply((e.target as HTMLInputElement).value);
    render();
  });
});

$("#use-gradient").addEventListener("change", () => {
  const on = ($("#use-gradient") as HTMLInputElement).checked;
  if (on) {
    state.style.dotsGradient = {
      from: ($("#gradient-from") as HTMLInputElement).value,
      to: ($("#gradient-to") as HTMLInputElement).value,
      type: ($("#gradient-type") as HTMLSelectElement).value as "linear" | "radial",
    };
  } else {
    state.style.dotsGradient = undefined;
  }
  toggleGradientUI();
  render();
});

["#gradient-from", "#gradient-to", "#gradient-type"].forEach((sel) => {
  $(sel).addEventListener("input", () => {
    if (!state.style.dotsGradient) return;
    state.style.dotsGradient = {
      from: ($("#gradient-from") as HTMLInputElement).value,
      to: ($("#gradient-to") as HTMLInputElement).value,
      type: ($("#gradient-type") as HTMLSelectElement).value as "linear" | "radial",
    };
    render();
  });
});

// Size + margin sliders
$("#size").addEventListener("input", (e) => {
  state.size = +(e.target as HTMLInputElement).value;
  $("#size-val").textContent = `${state.size}px`;
  render();
});
$("#margin").addEventListener("input", (e) => {
  state.margin = +(e.target as HTMLInputElement).value;
  $("#margin-val").textContent = `${state.margin}px`;
  render();
});

// Logo
const logoInput = $("#logo-input") as HTMLInputElement;
logoInput.addEventListener("change", () => {
  const f = logoInput.files?.[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.logo = e.target?.result as string;
    $("#logo-controls").classList.remove("hidden");
    render();
  };
  reader.readAsDataURL(f);
});
$("#logo-remove").addEventListener("click", () => {
  state.logo = null;
  logoInput.value = "";
  $("#logo-controls").classList.add("hidden");
  render();
});
$("#logo-size").addEventListener("input", (e) => {
  state.logoSize = +(e.target as HTMLInputElement).value;
  $("#logo-size-val").textContent = `${Math.round(state.logoSize * 100)}%`;
  render();
});
$("#hide-bg-dots").addEventListener("change", (e) => {
  state.hideBackgroundDots = (e.target as HTMLInputElement).checked;
  render();
});

// Color palettes
const palettesEl = $("#palettes");
colorPalettes.forEach((p) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.title = p.name;
  btn.className = "swatch";
  btn.style.background = `linear-gradient(135deg, ${p.dots} 50%, ${p.corners} 50%)`;
  btn.addEventListener("click", () => {
    state.style.dotsColor = p.dots;
    state.style.cornersColor = p.corners;
    state.style.backgroundColor = p.bg;
    state.style.dotsGradient = undefined;
    syncStyleControls();
    render();
  });
  palettesEl.appendChild(btn);
});

// Downloads
function download(ext: FileExtension) {
  qrCode.download({ name: `qr-${state.templateId}-${Date.now()}`, extension: ext });
}
$("#download-svg").addEventListener("click", () => download("svg"));
$("#download-png").addEventListener("click", () => download("png"));
$("#download-jpeg").addEventListener("click", () => download("jpeg"));
$("#download-webp").addEventListener("click", () => download("webp"));

// Copy data string
$("#copy-data").addEventListener("click", async () => {
  const tpl = templates.find((t) => t.id === state.templateId)!;
  const data = tpl.encode(state.data);
  await navigator.clipboard.writeText(data);
  const btn = $("#copy-data") as HTMLButtonElement;
  const original = btn.textContent;
  btn.textContent = "¡Copiado!";
  setTimeout(() => (btn.textContent = original), 1500);
});

// Print
$("#print-qr").addEventListener("click", () => window.print());

// Init
selectTemplate(state.templateId, false);
syncStyleControls();
$("#size-val").textContent = `${state.size}px`;
$("#margin-val").textContent = `${state.margin}px`;
$("#logo-size-val").textContent = `${Math.round(state.logoSize * 100)}%`;
