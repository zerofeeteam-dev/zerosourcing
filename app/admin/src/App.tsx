const metrics = [
  { label: "문의", value: "24", tone: "접수 대기 6건" },
  { label: "프로젝트", value: "12", tone: "진행 중 8건" },
  { label: "매출", value: "82.4M", tone: "이번 달 누적" },
];

const requests = [
  { client: "블루스톤", type: "앱 MVP", status: "검토" },
  { client: "한울커머스", type: "홈페이지", status: "견적" },
  { client: "노바랩스", type: "자동화", status: "진행" },
];

export function App() {
  return (
    <main className="admin-shell">
      <aside className="sidebar" aria-label="관리자 메뉴">
        <strong className="brand pretendard-bold-20">Zerosourcing</strong>
        <nav className="nav pretendard-medium-14" aria-label="주요 메뉴">
          <a href="/" aria-current="page">
            대시보드
          </a>
          <a href="/">문의</a>
          <a href="/">프로젝트</a>
          <a href="/">정산</a>
        </nav>
      </aside>

      <section className="content" aria-labelledby="page-title">
        <header className="topbar">
          <div>
            <p className="eyebrow pretendard-bold-12">ADMIN</p>
            <h1 id="page-title" className="pretendard-bold-28">
              관리자 대시보드
            </h1>
          </div>
          <button className="primary-button pretendard-bold-14" type="button">
            새 문의 등록
          </button>
        </header>

        <section className="metric-grid" aria-label="운영 지표">
          {metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <span className="pretendard-medium-14">{metric.label}</span>
              <strong className="pretendard-bold-32">{metric.value}</strong>
              <p className="pretendard-medium-14">{metric.tone}</p>
            </article>
          ))}
        </section>

        <section className="table-panel" aria-labelledby="requests-title">
          <h2 id="requests-title" className="pretendard-bold-20">
            최근 문의
          </h2>
          <div className="request-list">
            {requests.map((request) => (
              <article className="request-row" key={request.client}>
                <strong className="pretendard-bold-16">{request.client}</strong>
                <span className="pretendard-medium-14">{request.type}</span>
                <span className="status pretendard-bold-12">{request.status}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
