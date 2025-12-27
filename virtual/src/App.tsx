import { useMemo, useState } from "react";

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

const COLORS = [
  { key: "hai", label: "灰" },
  { key: "cha", label: "茶" },
  { key: "midori", label: "緑" },
  { key: "mizu", label: "水" },
  { key: "ao", label: "青" },
  { key: "ki", label: "黄" },
  { key: "dai", label: "橙" },
  { key: "aka", label: "赤" },
] as const;

const buildTimeOptions = (): string[] => {
  const res: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      res.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return res;
};

const toEpochSecond = (date: string, time: string): number => {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const dt = new Date(y, mo - 1, d, h, mi, 0);
  return Math.floor(dt.getTime() / 1000);
};

export default function App() {
  const [token, setToken] = useState("");

  const [start, setStart] = useState(212);
  const [end, setEnd] = useState(318);
  const [colors, setColors] = useState<string[]>([]);

  const [title, setTitle] = useState("Virtual Contest");
  const [mode, setMode] = useState<"normal" | "training">("training");
  const [isPublic, setIsPublic] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("00:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("00:00");

  const [result, setResult] = useState("");
  const timeOptions = useMemo(() => buildTimeOptions(), []);

  const toggleColor = (c: string) => {
    setColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const submit = async () => {
    if (!token) {
      alert("トークンの入力をしてください");
      return;
    }
    if (!startDate || !endDate) {
      alert("開始時刻・終了時刻を入力してください");
      return;
    }
    if (colors.length === 0) {
      alert("コンテストに登録する問題の色を選択してください");
      return;
    }

    const startEpochSecond = toEpochSecond(startDate, startTime);
    const endEpochSecond = toEpochSecond(endDate, endTime);
    const durationSecond = endEpochSecond - startEpochSecond;

    if (durationSecond <= 0) {
      alert("終了日が開始日よりも前にあります");
      return;
    }

    const body = {
      start,
      end,
      colors,
      title,
      startEpochSecond,
      durationSecond,
      isPublic,
      mode,
    };

    setResult("sending...");

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      if (!res.ok) {
        setResult(`ERROR ${res.status}\n${text}`);
        return;
      }

      const url = JSON.parse(text).url as string;
      setResult(url);
    } catch (e) {
      setResult(String(e));
    }
  };

  const previewStartEpoch =
    startDate && startTime ? toEpochSecond(startDate, startTime) : undefined;
  const previewEndEpoch =
    endDate && endTime ? toEpochSecond(endDate, endTime) : undefined;
  const previewDuration =
    previewStartEpoch && previewEndEpoch
      ? previewEndEpoch - previewStartEpoch
      : undefined;

  return (
    <div className="container">
      <h1>バーチャルコンテストまとめてつくる</h1>

      <label>
        GitHub Token
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="token (gho_...)"
        />
      </label>

      <label>
        ABC range
        <div className="row">
          <input
            type="number"
            value={start}
            onChange={(e) => setStart(+e.target.value)}
          />
          <input
            type="number"
            value={end}
            onChange={(e) => setEnd(+e.target.value)}
          />
        </div>
      </label>

      <label>コンテストに入れる色</label>
      <div className="colors">
        {COLORS.map((c) => (
          <label key={c.key}>
            <input
              type="checkbox"
              checked={colors.includes(c.key)}
              onChange={() => toggleColor(c.key)}
            />
            {c.label}
          </label>
        ))}
      </div>

      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>

      <label>
        開始
        <div className="row">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          >
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </label>

      <label>
        終了
        <div className="row">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <select value={endTime} onChange={(e) => setEndTime(e.target.value)}>
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </label>

      <pre>
        startEpochSecond: {previewStartEpoch ?? "-"}
        {"\n"}
        durationSecond: {previewDuration ?? "-"}
      </pre>

      <label>
        モード
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "normal" | "training")}
        >
          <option value="normal">normal</option>
          <option value="training">training</option>
        </select>
      </label>

      <label>
        公開設定
        <select
          value={String(isPublic)}
          onChange={(e) => setIsPublic(e.target.value === "true")}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </label>

      <button className="primary" onClick={submit}>
        Create Contest
      </button>

      {result && (
        <div className="result">
          <h2>コンテストURL</h2>
          <a href={result} target="_blank" rel="noopener noreferrer">
            {result}
          </a>
        </div>
      )}
    </div>
  );
}
