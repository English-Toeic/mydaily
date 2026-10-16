const ATT_BASE = "https://pgxqjqkmvprwhsuuolda.supabase.co/functions/v1";
const TRANSLATE_URL = "https://translate.jotme.io/api/translation/translate";
const ATT_KEY = import.meta.env.VITE_ATT_ANON_KEY as string | undefined;

export type TranscriptBlock = {
  text: string;
  StartTime: number;
  EndTime: number;
  VoiceStart?: number;
  VoiceEnd?: number;
  Speaker?: string;
};

type UploadUrlRes = {
  storage: string;
  method: string;
  uploadUrl: string;
  filePath: string;
  fileFormat: string;
};

type InitiateRes = {
  success: boolean;
  message: string;
  orderId: string;
};

type OrderRes = {
  success: boolean;
  status: string;
  message?: string;
  blocks?: TranscriptBlock[];
  audio_url?: string;
};

/* ---------- helpers ---------- */
function attHeaders(): Record<string, string> {
  return ATT_KEY ? { apikey: ATT_KEY, Authorization: `Bearer ${ATT_KEY}` } : {};
}

async function postJSON<T>(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal,
  });

  const raw = await res.text();
  let data: any = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Phản hồi không phải JSON (HTTP ${res.status}): ${raw.slice(0, 200)}`);
  }

  if (!res.ok || data?.error) {
    throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  }
  return data as T;
}

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

export function safeName(name: string) {
  return name.replace(/[^\w.-]/g, "_");
}

function getAnonSessionId() {
  const KEY = "att_anon_session_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(KEY, id);
  }
  return 'anon_1789358183866_8wkm32jlr';
}

/** Lọc câu "rác": "71.", "Questions 71 73." ... */
export function isNoiseBlock(text: string) {
  const t = text.trim();
  return /^\d+\.?$/.test(t) || /^questions?\s+\d+/i.test(t);
}

/* ---------- B1: lấy upload URL ---------- */
export function generateUploadUrl(file: File, signal?: AbortSignal) {
  return postJSON<UploadUrlRes>(
    `${ATT_BASE}/att-generate-upload-url`,
    {
      filename: `${Date.now()}_${safeName(file.name)}`,
      fileType: file.type || "audio/mpeg",
    },
    attHeaders(),
    signal
  );
}

/* ---------- B1.5: PUT file lên S3 ---------- */
export async function uploadToS3(uploadUrl: string, file: File, method = "PUT", signal?: AbortSignal) {
  const proxied = uploadUrl.replace(
    "https://audiototext-pipeline.s3.eu-central-1.amazonaws.com",
    "/s3-att"
  );

  // Chỉ ký header "host" nên KHÔNG thêm header x-amz-* nào
  const res = await fetch(proxied, { method, body: file, signal });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Upload S3 thất bại (HTTP ${res.status}) ${txt.slice(0, 200)}`);
  }
}

/* ---------- B2: khởi tạo transcription ---------- */
export function initiateTranscription(filePath: string, signal?: AbortSignal) {
  return postJSON<InitiateRes>(
    `${ATT_BASE}/att-initiate-transcription`,
    { filePath, isAssembly: true, anonymousSessionId: getAnonSessionId() },
    attHeaders(),
    signal
  );
}

/* ---------- B3: polling kết quả ---------- */
export async function waitForTranscription(
  orderId: string,
  opts: {
    signal?: AbortSignal;
    onStatus?: (s: string) => void;
    intervalMs?: number;
    timeoutMs?: number;
  } = {}
) {
  const { signal, onStatus, intervalMs = 3000, timeoutMs = 15 * 60 * 1000 } = opts;
  const started = Date.now();

  while (true) {
    const data = await postJSON<OrderRes>(
      `${ATT_BASE}/get-att-transcription-order`,
      { orderId },
      attHeaders(),
      signal
    );
    onStatus?.(data.status);

    if (data.status === "completed") return data;
    if (data.success === false || ["failed", "error"].includes(data.status)) {
      throw new Error(data.message || `Transcription lỗi: ${data.status}`);
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error("Quá thời gian chờ chuyển đổi");
    }
    await sleep(intervalMs, signal);
  }
}

/* ---------- Gộp B1 → B3 ---------- */
export async function transcribeAudio(
  file: File,
  opts: { signal?: AbortSignal; onProgress?: (msg: string) => void } = {}
): Promise<TranscriptBlock[]> {
  const { signal, onProgress } = opts;

  onProgress?.("1/4 Đang lấy URL upload...");
  const up = await generateUploadUrl(file, signal);

  onProgress?.("2/4 Đang upload audio...");
  await uploadToS3(up.uploadUrl, file, up.method || "PUT", signal);

  onProgress?.("3/4 Đang khởi tạo chuyển đổi...");
  const init = await initiateTranscription(up.filePath, signal);

  onProgress?.("4/4 Đang chuyển giọng nói thành văn bản...");
  const result = await waitForTranscription(init.orderId, {
    signal,
    onStatus: (s) => onProgress?.(`4/4 Đang xử lý (${s})...`),
  });

  return result.blocks ?? [];
}

/* ---------- B4: dịch ---------- */
export async function translateText(text: string, signal?: AbortSignal) {
  const proxied = TRANSLATE_URL.replace(
    "https://translate.jotme.io",
    "/translate-api"
  );
  const data = await postJSON<{ translatedText: string }>(
    proxied,
    { text, sourceLanguage: "Tiếng Anh", targetLanguage: "Tiếng Việt" },
    {},
    signal
  );
  return data.translatedText ?? "";
}

/** Dịch nhiều câu, giới hạn số request song song. Câu lỗi sẽ trả về "" */
export async function translateMany(
  texts: string[],
  opts: {
    concurrency?: number;
    signal?: AbortSignal;
    onProgress?: (done: number, total: number) => void;
  } = {}
) {
  const { concurrency = 3, signal, onProgress } = opts;
  const results = new Array<string>(texts.length).fill("");
  let next = 0;
  let done = 0;

  async function worker() {
    while (next < texts.length) {
      if (signal?.aborted) return;
      const i = next++;
      try {
        results[i] = await translateText(texts[i], signal);
      } catch (e) {
        console.warn("Dịch lỗi:", texts[i], e);
      }
      onProgress?.(++done, texts.length);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, texts.length) }, worker)
  );
  return results;
}