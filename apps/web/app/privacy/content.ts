export type PrivacyListItem = {
  href?: string;
  linkLabel?: string;
  subitems?: readonly PrivacyListItem[];
  suffix?: string;
  text: string;
};

export type PrivacyBlock =
  | {
      text: string;
      type: "paragraph";
    }
  | {
      items: readonly PrivacyListItem[];
      type: "ordered-list" | "unordered-list";
    };

export type PrivacyArticle = {
  blocks: readonly PrivacyBlock[];
  title: string;
};

export const privacyIntroduction =
  "제로피(제로소싱, 이하 ‘회사’)는 「개인정보 보호법」 등 관계 법령에 따라 개인정보를 보호하고, 외주 개발 문의 과정에서 처리하는 개인정보와 이용자의 권리를 다음과 같이 안내합니다.";

export const privacyArticles = [
  {
    title: "제1조 (개인정보의 처리 목적)",
    blocks: [
      {
        type: "ordered-list",
        items: [
          { text: "외주 개발 상담 접수와 본인·연락처 확인" },
          { text: "요구사항·예산 검토와 상담·견적 준비" },
          { text: "문의 답변, 민원 처리, 악성·반복 문의 방지" },
        ],
      },
    ],
  },
  {
    title: "제2조 (처리하는 개인정보의 항목 및 수집 방법)",
    blocks: [
      {
        type: "ordered-list",
        items: [
          {
            text: "필수 항목: 기업명, 담당자 성명, 이메일, 연락처, 선호 연락 방법, 예산",
          },
          { text: "선택 항목: 문의 내용" },
          {
            text: "수집 방법: /contact 문의 페이지에서 이용자가 직접 입력",
          },
        ],
      },
      {
        type: "paragraph",
        text: "문의 내용은 선택 항목입니다.",
      },
    ],
  },
  {
    title: "제3조 (처리의 법적 근거)",
    blocks: [
      {
        type: "ordered-list",
        items: [
          { text: "외주 문의 개인정보 수집·이용 동의" },
          { text: "개인정보 국외 이전 동의" },
          {
            text: "법령상 의무 이행 또는 분쟁 대응이 필요한 경우 해당 법령",
          },
        ],
      },
    ],
  },
  {
    title: "제4조 (처리 및 보유기간)",
    blocks: [
      {
        type: "ordered-list",
        items: [
          {
            text: "외주 문의 개인정보는 문의 접수일로부터 1년간 보관한 후 파기합니다.",
          },
          {
            text: "이용자가 삭제를 요청하고 더 이상 보관할 필요가 없는 경우에는 1년이 지나기 전이라도 파기합니다.",
          },
          {
            text: "외주 계약이 체결된 후 별도로 생성되는 계약서, 견적서 및 프로젝트 기록은 해당 개별 계약과 관계 법령에 따라 별도 관리합니다.",
          },
        ],
      },
    ],
  },
  {
    title: "제5조 (개인정보의 제3자 제공)",
    blocks: [
      {
        type: "paragraph",
        text: "회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.",
      },
      {
        type: "ordered-list",
        items: [
          {
            text: "정보주체가 별도로 동의한 경우 또는 관계 법령에 근거가 있는 경우에만 예외적으로 제공합니다.",
          },
          {
            text: "회사의 지시에 따라 개인정보를 처리하는 수탁자는 제3자 제공 대상이 아니며 제6조에서 공개합니다.",
          },
        ],
      },
    ],
  },
  {
    title: "제6조 (개인정보 처리업무의 위탁)",
    blocks: [
      {
        type: "paragraph",
        text: "회사는 외주 문의 처리를 위해 다음과 같이 업무를 위탁합니다. 애플리케이션 데이터베이스에는 문의를 저장하지 않습니다.",
      },
      {
        type: "unordered-list",
        items: [
          {
            text: "Vercel Inc.",
            subitems: [
              { text: "위탁 업무: 웹사이트 호스팅, 보안, 서버 함수 실행" },
            ],
          },
          {
            text: "Slack Technologies, LLC",
            subitems: [
              { text: "위탁 업무: 외주 문의 전달, 상담 알림, 내부 협업" },
            ],
          },
          {
            text: "수탁자 또는 위탁 업무가 변경되면 본 개인정보처리방침에서 공개합니다.",
          },
        ],
      },
    ],
  },
  {
    title: "제7조 (개인정보의 국외 이전)",
    blocks: [
      {
        type: "unordered-list",
        items: [
          {
            text: "이전받는 자: Vercel Inc.",
            subitems: [
              { text: "이전 국가: 미국" },
              {
                text: "이전 시점 및 방법: 이용자가 문의를 제출할 때 암호화된 네트워크를 통해 전송",
              },
              {
                text: "이전 항목: 문의 폼 입력값 및 IP 주소 등 서비스 처리 과정에서 생성되는 기술정보",
              },
              {
                text: "이전 목적: 웹사이트 호스팅, 보안 및 서버 함수 처리",
              },
              {
                text: "보유기간: Slack 전달 완료 시까지 일시 처리하며 애플리케이션 로그에 문의 본문을 기록하지 않음",
              },
            ],
          },
          {
            text: "이전받는 자: Slack Technologies, LLC",
            subitems: [
              { text: "이전 국가: 미국" },
              {
                text: "이전 시점 및 방법: 이용자가 문의를 제출할 때 암호화된 네트워크를 통해 전송",
              },
              {
                text: "이전 항목: 필수 항목과 이용자가 입력한 선택 문의 내용",
              },
              {
                text: "이전 목적: 문의 알림 및 내부 상담 협업",
              },
              { text: "보유기간: 문의 접수일로부터 1년" },
            ],
          },
        ],
      },
      {
        type: "paragraph",
        text: "이용자는 개인정보 국외 이전을 거부할 수 있습니다. 다만 필수 국외 이전에 동의하지 않으면 문의 폼을 제출할 수 없습니다.",
      },
    ],
  },
  {
    title: "제8조 (개인정보의 파기 절차 및 방법)",
    blocks: [
      {
        type: "ordered-list",
        items: [
          {
            text: "보유기간이 끝나거나 처리 목적이 달성되면 해당 개인정보를 지체 없이 파기합니다.",
          },
          {
            text: "Slack 문의 메시지와 첨부파일은 365일 후 자동 삭제하며, 유효한 삭제 요청을 받으면 수동으로 삭제합니다.",
          },
          {
            text: "전자적 파일은 복구하거나 재생하기 어려운 방법으로 삭제합니다.",
          },
        ],
      },
    ],
  },
  {
    title: "제9조 (정보주체의 권리와 행사 방법)",
    blocks: [
      {
        type: "ordered-list",
        items: [
          {
            text: "이용자는 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지 및 동의 철회를 요청할 수 있습니다.",
          },
          {
            text: "요청은 contact@zerofee.kr 또는 010-3242-8118로 접수할 수 있습니다.",
          },
          {
            text: "회사는 요청자가 본인 또는 정당한 대리인인지 확인한 후 관계 법령에서 정한 기한 안에 처리합니다.",
          },
        ],
      },
    ],
  },
  {
    title: "제10조 (자동 수집 정보 및 외부 서비스)",
    blocks: [
      {
        type: "ordered-list",
        items: [
          {
            text: "현재 회사는 맞춤형 광고나 행동정보 분석을 위한 쿠키를 운영하지 않습니다.",
          },
          {
            text: "사이트 호스팅 및 보안 과정에서 IP 주소와 접속 정보가 생성될 수 있습니다.",
          },
          {
            text: "회사소개 페이지에서 Google 지도가 표시되는 경우 Google LLC가 IP 주소와 기기·브라우저 정보를 처리할 수 있으며 Google 개인정보처리방침이 적용됩니다.",
          },
        ],
      },
    ],
  },
  {
    title: "제11조 (개인정보의 안전성 확보조치)",
    blocks: [
      {
        type: "unordered-list",
        items: [
          { text: "HTTPS를 통한 전송 구간 암호화" },
          {
            text: "Slack 문의 채널 접근 권한 최소화 및 분기별 접근자 점검",
          },
          { text: "비밀키의 서버 환경변수 관리" },
          {
            text: "서버 로그에 문의 본문, Slack 토큰 및 채널 ID를 기록하지 않음",
          },
          {
            text: "문의 폼에서 민감정보 및 고유식별정보를 입력하지 않도록 안내",
          },
        ],
      },
    ],
  },
  {
    title: "제12조 (개인정보 보호책임자 및 고충 처리)",
    blocks: [
      {
        type: "unordered-list",
        items: [
          { text: "개인정보 보호책임자: 이동규" },
          {
            text: "이메일: ",
            href: "mailto:contact@zerofee.kr",
            linkLabel: "contact@zerofee.kr",
          },
          {
            text: "전화: ",
            href: "tel:01032428118",
            linkLabel: "010-3242-8118",
          },
        ],
      },
    ],
  },
  {
    title: "제13조 (권익침해 구제 및 방침 변경)",
    blocks: [
      {
        type: "paragraph",
        text: "이용자는 개인정보 침해에 관한 상담이나 구제를 아래 기관에 요청할 수 있습니다.",
      },
      {
        type: "unordered-list",
        items: [
          {
            text: "개인정보침해신고센터 (",
            href: "https://privacy.kisa.or.kr/",
            linkLabel: "privacy.kisa.or.kr",
            suffix: " / 국번없이 118)",
          },
          {
            text: "개인정보분쟁조정위원회 (",
            href: "https://www.kopico.go.kr/",
            linkLabel: "kopico.go.kr",
            suffix: " / 1833-6972)",
          },
          {
            text: "대검찰청 (",
            href: "https://www.spo.go.kr/",
            linkLabel: "spo.go.kr",
            suffix: " / 국번없이 1301)",
          },
          {
            text: "경찰청 (",
            href: "https://ecrm.police.go.kr/",
            linkLabel: "ecrm.police.go.kr",
            suffix: " / 국번없이 182)",
          },
        ],
      },
      {
        type: "paragraph",
        text: "회사는 방침을 변경할 때 시행일과 변경 내용을 이 페이지에 공개하며, 이용자에게 불리한 중대한 변경은 시행 30일 전에 공개합니다.",
      },
      {
        type: "paragraph",
        text: "시행일: 2026년 7월 27일",
      },
    ],
  },
] as const satisfies readonly PrivacyArticle[];
