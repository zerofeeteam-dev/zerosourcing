export type TermsListItem = {
  number?: number;
  subitems?: readonly string[];
  text: string;
};

export type TermsBlock =
  | {
      text: string;
      type: "paragraph";
    }
  | {
      items: readonly TermsListItem[];
      type: "ordered-list";
    };

export type TermsArticle = {
  blocks: readonly TermsBlock[];
  title: string;
};

export type TermsChapter = {
  articles: readonly TermsArticle[];
  title: string;
};

export const termsChapters = [
  {
    title: "제1장 총칙",
    articles: [
      {
        title: "제1조 (목적)",
        blocks: [
          {
            type: "paragraph",
            text: "본 약관은 제로피(제로소싱, 이하 ‘회사’)가 운영하는 zerosourcing.kr 웹사이트에서 제공하는 회사·서비스 정보 열람 및 외주 개발 문의 기능의 이용 조건과 회사 및 이용자의 권리·의무를 정함을 목적으로 합니다.",
          },
        ],
      },
      {
        title: "제2조 (정의)",
        blocks: [
          {
            type: "ordered-list",
            items: [
              {
                text: "사이트: 회사가 운영하는 zerosourcing.kr 및 그 하위 페이지를 말합니다.",
              },
              {
                text: "이용자: 사이트를 방문하거나 문의 기능을 사용하는 자를 말합니다.",
              },
              {
                text: "문의 서비스: 이용자가 외주 개발 상담을 위해 정보를 제출하고 회사가 이를 검토해 연락하는 기능을 말합니다.",
              },
              {
                text: "개별 계약: 견적서, 업무범위서, 개발 계약서 등 회사와 고객이 별도로 합의한 문서를 말합니다.",
              },
            ],
          },
        ],
      },
      {
        title: "제3조 (약관과 개별 계약의 관계)",
        blocks: [
          {
            type: "ordered-list",
            items: [
              {
                text: "문의 제출만으로 외주 개발 계약이 성립하지 않습니다.",
              },
              {
                text: "프로젝트의 범위, 일정, 대금, 검수, 결과물의 권리, 유지보수와 하자 책임은 별도 개별 계약에서 정합니다.",
              },
              {
                text: "본 약관과 개별 계약이 충돌하는 경우 개별 계약의 내용이 우선합니다.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "제2장 사이트 이용",
    articles: [
      {
        title: "제4조 (사이트가 제공하는 기능)",
        blocks: [
          {
            type: "ordered-list",
            items: [
              {
                text: "회사·서비스·포트폴리오·블로그·FAQ 정보 제공",
              },
              {
                text: "외주 개발 문의 접수 및 상담 연락",
              },
              {
                text: "회사가 제공하거나 연결하는 기타 정보 기능",
              },
            ],
          },
        ],
      },
      {
        title: "제5조 (문의 접수)",
        blocks: [
          {
            type: "ordered-list",
            items: [
              {
                text: "이용자는 정확하고 연락 가능한 정보를 입력해야 합니다.",
              },
              {
                text: "회사가 제공하는 상담 내용과 예상 견적은 개별 계약 체결 전까지 확정된 계약 조건이 아닙니다.",
              },
              {
                text: "회사는 문의 내용, 수행 가능성 또는 운영 사정에 따라 상담이나 견적 제공을 제한할 수 있습니다.",
              },
            ],
          },
        ],
      },
      {
        title: "제6조 (이용자의 의무)",
        blocks: [
          {
            type: "ordered-list",
            items: [
              {
                text: "타인의 정보를 도용하거나 허위 정보를 입력하는 행위",
              },
              {
                text: "사이트 또는 제3자의 권리를 침해하거나 불법 정보를 전송하는 행위",
              },
              {
                text: "악성 코드, 과도한 자동 요청 등 사이트 운영을 방해하는 행위",
              },
            ],
          },
        ],
      },
      {
        title: "제7조 (사이트 콘텐츠의 권리)",
        blocks: [
          {
            type: "paragraph",
            text: "사이트의 문구, 디자인, 상표, 포트폴리오와 기타 콘텐츠의 권리는 회사 또는 정당한 권리자에게 있으며, 사전 허락 없이 영리 목적으로 복제·배포·수집할 수 없습니다.",
          },
        ],
      },
      {
        title: "제8조 (이용자가 제출한 내용)",
        blocks: [
          {
            type: "paragraph",
            text: "회사는 이용자가 문의에 제출한 내용을 상담 검토와 연락에 필요한 범위에서만 사용합니다. 문의 제출로 이용자의 아이디어나 자료의 소유권이 회사에 이전되지는 않습니다.",
          },
        ],
      },
      {
        title: "제9조 (외부 서비스와 링크)",
        blocks: [
          {
            type: "paragraph",
            text: "사이트에는 외부 웹사이트나 지도 서비스가 연결될 수 있으며, 외부 서비스의 이용에는 해당 사업자의 약관과 개인정보 처리 기준이 적용됩니다.",
          },
        ],
      },
    ],
  },
  {
    title: "제3장 책임 및 기타",
    articles: [
      {
        title: "제10조 (책임의 범위)",
        blocks: [
          {
            type: "ordered-list",
            items: [
              {
                text: "회사는 고의 또는 중대한 과실이 없는 한 천재지변, 통신 장애, 이용자의 귀책사유로 발생한 손해에 책임을 지지 않습니다.",
              },
              {
                text: "외주 개발 프로젝트에 관한 책임은 해당 개별 계약에 따릅니다.",
              },
              {
                text: "본 조는 관계 법령상 배제할 수 없는 회사의 책임을 제한하지 않습니다.",
              },
              {
                text: "문의 과정의 개인정보 처리는 개인정보처리방침에 따릅니다.",
              },
            ],
          },
        ],
      },
      {
        title: "제11조 (약관의 변경)",
        blocks: [
          {
            type: "paragraph",
            text: "회사는 관계 법령과 서비스 변경을 반영해 약관을 개정할 수 있으며, 시행일과 변경 내용을 사이트에 게시합니다. 이용자에게 불리한 중대한 변경은 시행 30일 전에 알립니다.",
          },
        ],
      },
      {
        title: "제12조 (준거법 및 관할)",
        blocks: [
          {
            type: "paragraph",
            text: "본 약관은 대한민국 법률에 따르며, 분쟁의 관할은 민사소송법 등 관계 법령에 따릅니다.",
          },
        ],
      },
    ],
  },
] as const satisfies readonly TermsChapter[];

export const termsEffectiveDate = "본 약관은 2026년 7월 27일부터 시행됩니다.";
