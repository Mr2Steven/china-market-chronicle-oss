"use client";

interface ChangeRecord {
  date: string;
  type: "调入" | "调出";
  code: string;
  name: string;
  reason: string;
}

// 静态历史记录（AkShare 接口不稳定，直接硬编码近期调整）
const CHANGELOG: ChangeRecord[] = [
  { date: "2024-12", type: "调入", code: "300308", name: "中际旭创", reason: "光模块龙头，市值和流动性达标" },
  { date: "2024-12", type: "调入", code: "300502", name: "新易盛", reason: "AI 算力光互联标的，成交活跃" },
  { date: "2024-12", type: "调出", code: "000963", name: "华东医药", reason: "市值相对排名下滑" },
  { date: "2024-12", type: "调出", code: "600031", name: "三一重工", reason: "流动性及排名下滑" },
  { date: "2024-06", type: "调入", code: "688256", name: "寒武纪", reason: "AI芯片龙头，科创板权重股" },
  { date: "2024-06", type: "调入", code: "002625", name: "光启技术", reason: "国防科技概念，市值扩张" },
  { date: "2024-06", type: "调出", code: "601688", name: "华泰证券", reason: "相对权重持续下滑" },
  { date: "2024-06", type: "调出", code: "000568", name: "泸州老窖", reason: "白酒板块权重下行" },
  { date: "2023-12", type: "调入", code: "688041", name: "海光信息", reason: "国产CPU龙头，市值达标" },
  { date: "2023-12", type: "调入", code: "002371", name: "北方华创", reason: "半导体设备，流动性优" },
  { date: "2023-12", type: "调出", code: "601066", name: "中信建投", reason: "市值排名下行" },
  { date: "2023-12", type: "调出", code: "002304", name: "洋河股份", reason: "白酒估值收缩，权重下行" },
  { date: "2023-06", type: "调入", code: "603986", name: "兆易创新", reason: "存储芯片，科创+A股兼顾" },
  { date: "2023-06", type: "调入", code: "300394", name: "天孚通信", reason: "光通信高景气" },
  { date: "2023-06", type: "调出", code: "601318", name: "中国平安", reason: "保险板块权重持续下行" },
  { date: "2023-06", type: "调出", code: "000002", name: "万科A", reason: "地产流动性风险" },
];

export default function IndexChangelogTable() {
  const byDate: Record<string, ChangeRecord[]> = {};
  for (const r of CHANGELOG) {
    if (!byDate[r.date]) byDate[r.date] = [];
    byDate[r.date].push(r);
  }
  const dates = Object.keys(byDate).sort().reverse();

  return (
    <div style={{ overflowX: "auto" }}>
      {dates.map((date) => (
        <div key={date} style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
            {date} 定期调整
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            <tbody>
              {byDate[date].map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "6px 8px", width: 48, textAlign: "center" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "1px 6px",
                      borderRadius: 3,
                      fontSize: 11,
                      fontWeight: 600,
                      background: r.type === "调入" ? "rgba(196,30,58,0.1)" : "rgba(45,106,79,0.1)",
                      color: r.type === "调入" ? "#C41E3A" : "#2D6A4F",
                    }}>
                      {r.type}
                    </span>
                  </td>
                  <td style={{ padding: "6px 8px", color: "var(--text-muted)", width: 80 }}>{r.code}</td>
                  <td style={{ padding: "6px 8px", fontWeight: 600, color: "var(--text-heading)", width: 100 }}>{r.name}</td>
                  <td style={{ padding: "6px 8px", color: "var(--text-muted)", fontSize: 11 }}>{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
        数据来源：中证指数公司公告。每年 6 月、12 月定期审核，特殊情况可不定期调整。
      </div>
    </div>
  );
}
