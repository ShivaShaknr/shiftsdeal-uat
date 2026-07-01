// lib/whatsapp.ts

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;

const BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

type WhatsAppLanguageCode = "en" | "en_US" | "en_GB";

type TemplateTextParam = {
  type: "text";
  text: string;
};

type TemplateDocumentParam = {
  type: "document";
  document: {
    id?: string;
    link?: string;
    filename?: string;
  };
};

type TemplateImageParam = {
  type: "image";
  image: {
    id?: string;
    link?: string;
  };
};

type TemplateVideoParam = {
  type: "video";
  video: {
    id?: string;
    link?: string;
  };
};

type TemplateParam =
  | TemplateTextParam
  | TemplateDocumentParam
  | TemplateImageParam
  | TemplateVideoParam;

type TemplateComponent = {
  type: "header" | "body";
  parameters: TemplateParam[];
};

export async function uploadWhatsAppMedia(params: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}) {
  const formData = new FormData();

  formData.append("messaging_product", "whatsapp");

  const arrayBuffer = params.buffer.buffer.slice(
    params.buffer.byteOffset,
    params.buffer.byteOffset + params.buffer.byteLength
  ) as ArrayBuffer;
  
  const blob = new Blob([arrayBuffer], {
    type: params.mimeType,
  });

  formData.append("file", blob, params.filename);

  const res = await fetch(`${BASE_URL}/${PHONE_NUMBER_ID}/media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("WhatsApp media upload failed:", data);
    throw new Error(data?.error?.message || "WhatsApp media upload failed");
  }

  return data.id as string;
}

export async function sendWhatsAppTemplate(params: {
  to: string;
  templateName: string;
  languageCode?: WhatsAppLanguageCode;
  components?: TemplateComponent[];
}) {
  const cleanPhone = params.to.replace("+", "").replace(/\s/g, "");
  const res = await fetch(`${BASE_URL}/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: params.templateName,
        language: {
          code: params.languageCode || "en",
        },
        components: params.components || [],
      },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("WhatsApp template send failed:", data);
    throw new Error(data?.error?.message || "WhatsApp template send failed");
  }

  return data;
}