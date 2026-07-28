export type ConsentNotice = {
  id: "collection-use" | "overseas-transfer";
  rows: readonly {
    label: string;
    value: string;
  }[];
  title: string;
};

export const consentNotices = [
  {
    id: "collection-use",
    title: "개인정보 수집·이용 동의",
    rows: [
      {
        label: "수집·이용 목적",
        value: "외주 개발 상담 접수, 연락 및 견적 검토",
      },
      {
        label: "수집 항목",
        value:
          "필수 항목은 기업명, 담당자 성명, 이메일, 연락처, 선호 연락 방법, 예산이며 문의 내용은 선택 항목입니다.",
      },
      {
        label: "보유 및 이용기간",
        value: "문의 접수일로부터 1년",
      },
      {
        label: "동의 거부 권리 및 불이익",
        value:
          "동의를 거부할 수 있으나 필수 항목 동의 없이는 문의를 제출할 수 없습니다.",
      },
    ],
  },
  {
    id: "overseas-transfer",
    title: "개인정보 국외 이전 동의",
    rows: [
      {
        label: "이전받는 자",
        value: "Vercel Inc., Slack Technologies, LLC",
      },
      {
        label: "이전 국가",
        value: "미국",
      },
      {
        label: "이전 시점 및 방법",
        value: "문의 제출 시 암호화된 네트워크를 통해 전송",
      },
      {
        label: "이전 항목",
        value: "필수 항목과 이용자가 입력한 선택 문의 내용",
      },
      {
        label: "이전 목적",
        value: "사이트 호스팅·서버 처리, 문의 알림 및 내부 상담 협업",
      },
      {
        label: "보유기간",
        value:
          "Vercel은 Slack 전달 완료 시까지 일시 처리하며, Slack은 문의 접수일로부터 1년간 보관합니다.",
      },
      {
        label: "동의 거부 권리 및 불이익",
        value:
          "동의를 거부할 수 있으나 국외 이전 동의 없이는 문의를 제출할 수 없습니다.",
      },
    ],
  },
] as const satisfies readonly ConsentNotice[];
