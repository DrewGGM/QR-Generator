/**
 * Pre-loaded templates with branded styling presets.
 * Each template defines: identity, fields the user fills, encoder, and a styling preset.
 */

export type FieldType = "text" | "url" | "tel" | "email" | "password" | "textarea" | "select" | "date" | "datetime-local";

export interface TemplateField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  help?: string;
}

export interface StylePreset {
  dotsType: "rounded" | "dots" | "classy" | "classy-rounded" | "square" | "extra-rounded";
  cornersSquareType: "dot" | "square" | "extra-rounded";
  cornersDotType: "dot" | "square";
  dotsColor: string;
  dotsGradient?: { from: string; to: string; type: "linear" | "radial" };
  cornersColor: string;
  backgroundColor: string;
  errorCorrection: "L" | "M" | "Q" | "H";
}

export interface FramePreset {
  style: "none" | "simple" | "label" | "rounded" | "scan";
  text: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export interface QRTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  fields: TemplateField[];
  encode: (data: Record<string, string>) => string;
  preset: StylePreset;
  framePreset?: FramePreset;
}

const defaultPreset: StylePreset = {
  dotsType: "rounded",
  cornersSquareType: "extra-rounded",
  cornersDotType: "dot",
  dotsColor: "#1a2570",
  cornersColor: "#4f6df5",
  backgroundColor: "#ffffff",
  errorCorrection: "H",
};

export const templates: QRTemplate[] = [
  {
    id: "url",
    name: "URL / Web",
    emoji: "🔗",
    description: "Enlace directo a una página web",
    fields: [
      { key: "url", label: "URL", type: "url", placeholder: "https://tu-sitio.com", required: true },
    ],
    encode: (d) => d.url || "",
    preset: defaultPreset,
  },
  {
    id: "menu",
    name: "Menú restaurante",
    emoji: "🍽️",
    description: "QR para menú digital (PDF, web o Google Drive)",
    fields: [
      { key: "url", label: "URL del menú", type: "url", placeholder: "https://drive.google.com/...", required: true, help: "Sube tu menú a Google Drive, GitHub o tu web y pega el enlace." },
    ],
    encode: (d) => d.url || "",
    preset: {
      dotsType: "classy-rounded",
      cornersSquareType: "extra-rounded",
      cornersDotType: "dot",
      dotsColor: "#5b3a1f",
      dotsGradient: { from: "#8b5a2b", to: "#5b3a1f", type: "linear" },
      cornersColor: "#c9a36b",
      backgroundColor: "#fff8ef",
      errorCorrection: "H",
    },
    framePreset: { style: "label", text: "MENÚ", textColor: "#fff8ef", bgColor: "#5b3a1f", borderColor: "#5b3a1f" },
  },
  {
    id: "wifi",
    name: "WiFi",
    emoji: "📶",
    description: "Conectar al WiFi sin escribir la contraseña",
    fields: [
      { key: "ssid", label: "Nombre de la red (SSID)", type: "text", placeholder: "Mi-WiFi", required: true },
      { key: "password", label: "Contraseña", type: "password", placeholder: "••••••••" },
      {
        key: "encryption", label: "Tipo de seguridad", type: "select", required: true,
        options: [
          { value: "WPA", label: "WPA / WPA2 / WPA3" },
          { value: "WEP", label: "WEP" },
          { value: "nopass", label: "Red abierta" },
        ],
      },
      {
        key: "hidden", label: "Red oculta", type: "select",
        options: [
          { value: "false", label: "No" },
          { value: "true", label: "Sí" },
        ],
      },
    ],
    encode: (d) => {
      const esc = (v: string) => (v || "").replace(/([\\;,":])/g, "\\$1");
      const enc = d.encryption || "WPA";
      const pwd = enc === "nopass" ? "" : esc(d.password || "");
      return `WIFI:T:${enc};S:${esc(d.ssid || "")};P:${pwd};H:${d.hidden === "true" ? "true" : "false"};;`;
    },
    preset: {
      dotsType: "dots",
      cornersSquareType: "extra-rounded",
      cornersDotType: "dot",
      dotsColor: "#0ea5e9",
      cornersColor: "#0369a1",
      backgroundColor: "#ffffff",
      errorCorrection: "H",
    },
    framePreset: { style: "label", text: "WIFI GRATIS", textColor: "#ffffff", bgColor: "#0369a1", borderColor: "#0369a1" },
  },
  {
    id: "vcard",
    name: "Contacto (vCard)",
    emoji: "👤",
    description: "Tarjeta de contacto profesional",
    fields: [
      { key: "firstName", label: "Nombre", type: "text", placeholder: "Juan", required: true },
      { key: "lastName", label: "Apellido", type: "text", placeholder: "Pérez" },
      { key: "org", label: "Empresa", type: "text", placeholder: "ACME S.L." },
      { key: "title", label: "Cargo", type: "text", placeholder: "Director de Ventas" },
      { key: "phone", label: "Teléfono", type: "tel", placeholder: "+34 600 000 000" },
      { key: "email", label: "Email", type: "email", placeholder: "juan@empresa.com" },
      { key: "website", label: "Sitio web", type: "url", placeholder: "https://..." },
      { key: "address", label: "Dirección", type: "text", placeholder: "Calle, Ciudad, País" },
    ],
    encode: (d) => {
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${d.lastName || ""};${d.firstName || ""}`,
        `FN:${[d.firstName, d.lastName].filter(Boolean).join(" ")}`,
      ];
      if (d.org) lines.push(`ORG:${d.org}`);
      if (d.title) lines.push(`TITLE:${d.title}`);
      if (d.phone) lines.push(`TEL;TYPE=CELL:${d.phone}`);
      if (d.email) lines.push(`EMAIL:${d.email}`);
      if (d.website) lines.push(`URL:${d.website}`);
      if (d.address) lines.push(`ADR:;;${d.address};;;;`);
      lines.push("END:VCARD");
      return lines.join("\n");
    },
    preset: {
      dotsType: "rounded",
      cornersSquareType: "extra-rounded",
      cornersDotType: "dot",
      dotsColor: "#1e293b",
      cornersColor: "#475569",
      backgroundColor: "#ffffff",
      errorCorrection: "H",
    },
  },
  {
    id: "social",
    name: "Redes sociales",
    emoji: "📱",
    description: "Instagram, TikTok, WhatsApp, etc.",
    fields: [
      {
        key: "network", label: "Red social", type: "select", required: true,
        options: [
          { value: "instagram", label: "Instagram" },
          { value: "tiktok", label: "TikTok" },
          { value: "whatsapp", label: "WhatsApp" },
          { value: "youtube", label: "YouTube" },
          { value: "x", label: "X (Twitter)" },
          { value: "facebook", label: "Facebook" },
          { value: "linkedin", label: "LinkedIn" },
        ],
      },
      { key: "username", label: "Usuario o número", type: "text", placeholder: "@tu_usuario o 34600000000", required: true, help: "Para WhatsApp usa el número con código de país, sin '+'." },
    ],
    encode: (d) => {
      const u = (d.username || "").replace(/^@/, "").trim();
      switch (d.network) {
        case "instagram": return `https://instagram.com/${u}`;
        case "tiktok": return `https://tiktok.com/@${u}`;
        case "whatsapp": return `https://wa.me/${u.replace(/[^0-9]/g, "")}`;
        case "youtube": return `https://youtube.com/@${u}`;
        case "x": return `https://x.com/${u}`;
        case "facebook": return `https://facebook.com/${u}`;
        case "linkedin": return `https://linkedin.com/in/${u}`;
        default: return u;
      }
    },
    preset: {
      dotsType: "extra-rounded",
      cornersSquareType: "extra-rounded",
      cornersDotType: "dot",
      dotsColor: "#7c3aed",
      dotsGradient: { from: "#ec4899", to: "#7c3aed", type: "linear" },
      cornersColor: "#7c3aed",
      backgroundColor: "#ffffff",
      errorCorrection: "H",
    },
    framePreset: { style: "rounded", text: "SÍGUEME", textColor: "#ffffff", bgColor: "#7c3aed", borderColor: "#7c3aed" },
  },
  {
    id: "maps",
    name: "Google Maps",
    emoji: "📍",
    description: "Ubicación de tu negocio",
    fields: [
      { key: "query", label: "Dirección o nombre del lugar", type: "text", placeholder: "Plaza Mayor, Madrid", required: true },
    ],
    encode: (d) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.query || "")}`,
    preset: {
      dotsType: "rounded",
      cornersSquareType: "extra-rounded",
      cornersDotType: "dot",
      dotsColor: "#dc2626",
      cornersColor: "#16a34a",
      backgroundColor: "#ffffff",
      errorCorrection: "H",
    },
    framePreset: { style: "label", text: "CÓMO LLEGAR", textColor: "#ffffff", bgColor: "#dc2626", borderColor: "#dc2626" },
  },
  {
    id: "payment",
    name: "Pago / Propina",
    emoji: "💳",
    description: "PayPal, Bizum, Yape, Plin",
    fields: [
      {
        key: "service", label: "Servicio", type: "select", required: true,
        options: [
          { value: "paypal", label: "PayPal.me" },
          { value: "bizum", label: "Bizum (España)" },
          { value: "yape", label: "Yape (Perú)" },
          { value: "plin", label: "Plin (Perú)" },
          { value: "custom", label: "URL personalizada" },
        ],
      },
      { key: "id", label: "Usuario / Teléfono / URL", type: "text", placeholder: "tu-usuario o número", required: true },
      { key: "amount", label: "Monto sugerido (opcional)", type: "text", placeholder: "10.00" },
    ],
    encode: (d) => {
      const id = (d.id || "").trim();
      const amt = d.amount ? `/${d.amount}` : "";
      switch (d.service) {
        case "paypal": return `https://paypal.me/${id.replace(/^@/, "")}${amt}`;
        case "bizum": return `BIZUM:${id}${d.amount ? `:${d.amount}` : ""}`;
        case "yape": return `https://yape.pe/${id.replace(/[^0-9]/g, "")}`;
        case "plin": return `tel:${id.replace(/[^0-9+]/g, "")}`;
        default: return id;
      }
    },
    preset: {
      dotsType: "classy-rounded",
      cornersSquareType: "extra-rounded",
      cornersDotType: "dot",
      dotsColor: "#059669",
      dotsGradient: { from: "#10b981", to: "#047857", type: "linear" },
      cornersColor: "#047857",
      backgroundColor: "#ffffff",
      errorCorrection: "H",
    },
    framePreset: { style: "label", text: "PAGAR AQUÍ", textColor: "#ffffff", bgColor: "#047857", borderColor: "#047857" },
  },
  {
    id: "email",
    name: "Email / SMS / Llamada",
    emoji: "✉️",
    description: "Acción directa al escanear",
    fields: [
      {
        key: "action", label: "Acción", type: "select", required: true,
        options: [
          { value: "email", label: "Enviar email" },
          { value: "sms", label: "Enviar SMS" },
          { value: "call", label: "Llamar" },
        ],
      },
      { key: "target", label: "Destinatario / Número", type: "text", placeholder: "ejemplo@correo.com o +34600000000", required: true },
      { key: "subject", label: "Asunto (solo email)", type: "text", placeholder: "Hola..." },
      { key: "body", label: "Mensaje", type: "textarea", placeholder: "Texto del mensaje..." },
    ],
    encode: (d) => {
      const target = (d.target || "").trim();
      switch (d.action) {
        case "email": {
          const params = new URLSearchParams();
          if (d.subject) params.set("subject", d.subject);
          if (d.body) params.set("body", d.body);
          const q = params.toString();
          return `mailto:${target}${q ? `?${q}` : ""}`;
        }
        case "sms": return `sms:${target}${d.body ? `?body=${encodeURIComponent(d.body)}` : ""}`;
        case "call": return `tel:${target}`;
        default: return target;
      }
    },
    preset: {
      dotsType: "rounded",
      cornersSquareType: "extra-rounded",
      cornersDotType: "dot",
      dotsColor: "#0f172a",
      cornersColor: "#3b82f6",
      backgroundColor: "#ffffff",
      errorCorrection: "H",
    },
  },
  {
    id: "event",
    name: "Evento / Calendario",
    emoji: "📅",
    description: "Añadir evento al calendario",
    fields: [
      { key: "title", label: "Título", type: "text", placeholder: "Reunión importante", required: true },
      { key: "location", label: "Ubicación", type: "text", placeholder: "Calle..." },
      { key: "start", label: "Inicio", type: "datetime-local", required: true },
      { key: "end", label: "Fin", type: "datetime-local", required: true },
      { key: "description", label: "Descripción", type: "textarea" },
    ],
    encode: (d) => {
      const fmt = (s: string) => s ? s.replace(/[-:]/g, "").replace(/\.\d+/, "") + "00" : "";
      const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `SUMMARY:${d.title || ""}`,
        `DTSTART:${fmt(d.start)}`,
        `DTEND:${fmt(d.end)}`,
      ];
      if (d.location) lines.push(`LOCATION:${d.location}`);
      if (d.description) lines.push(`DESCRIPTION:${d.description}`);
      lines.push("END:VEVENT", "END:VCALENDAR");
      return lines.join("\n");
    },
    preset: {
      dotsType: "rounded",
      cornersSquareType: "extra-rounded",
      cornersDotType: "dot",
      dotsColor: "#9333ea",
      cornersColor: "#6b21a8",
      backgroundColor: "#ffffff",
      errorCorrection: "H",
    },
  },
  {
    id: "text",
    name: "Texto plano",
    emoji: "📝",
    description: "Cualquier texto que quieras codificar",
    fields: [
      { key: "text", label: "Texto", type: "textarea", placeholder: "Escribe lo que quieras...", required: true },
    ],
    encode: (d) => d.text || "",
    preset: defaultPreset,
  },
];

export const colorPalettes = [
  { name: "Clásico", dots: "#000000", corners: "#000000", bg: "#ffffff" },
  { name: "Azul", dots: "#1a2570", corners: "#4f6df5", bg: "#ffffff" },
  { name: "Esmeralda", dots: "#064e3b", corners: "#10b981", bg: "#ffffff" },
  { name: "Rosa", dots: "#9d174d", corners: "#ec4899", bg: "#ffffff" },
  { name: "Naranja", dots: "#9a3412", corners: "#f97316", bg: "#fffbeb" },
  { name: "Vino", dots: "#7f1d1d", corners: "#dc2626", bg: "#fef2f2" },
  { name: "Café", dots: "#5b3a1f", corners: "#c9a36b", bg: "#fff8ef" },
  { name: "Oscuro", dots: "#f5f5f5", corners: "#a3a3a3", bg: "#0a0a0a" },
];
