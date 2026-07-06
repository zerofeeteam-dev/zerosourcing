import { SectionShell } from "./SectionShell";
import { ServiceCard } from "./ServiceCard";
import styles from "./BusinessTypesSection.module.css";

const services = [
  {
    badge: "주력",
    description: [
      "핵심 기능만으로 검증부터.",
      "군더더기는 덜어내고, 출시까지 가장 짧은 길로.",
    ],
    headline: "아이디어를 가장 빠르게 시장 앞에",
    iconName: "package-02" as const,
    title: "MVP 개발",
  },
  {
    description: ["두 플랫폼을 따로 만들 필요 없이.", "비용도 일정도 가볍게."],
    headline: "한 번 개발로 iOS·안드로이드 동시에",
    iconName: "device-mobile" as const,
    title: "하이브리드 앱",
  },
  {
    description: ["브랜드를 담은 반응형 사이트.", "어떤 화면에서도 단정하게."],
    headline: "회사의 첫인상을 신뢰로",
    iconName: "home-02" as const,
    title: "기업 홈페이지",
  },
  {
    actionLabel: "상담으로 시작하기",
    description: [
      "딱 맞는 항목이 없어도 괜찮습니다.",
      "무엇을 만들고 싶은지부터 들려주세요.",
    ],
    headline: "어디에도 없는 형태인가요?",
  },
];

export function BusinessTypesSection() {
  return (
    <SectionShell
      description={
        <>
          MVP 개발부터 하이브리드 앱, 기업 홈페이지, 강의 플랫폼, 온라인
          쇼핑몰까지.
          <br />
          검증할 제품부터 자리 잡은 비즈니스의 무대까지, 필요한 만큼만 만듭니다.
        </>
      }
      label="이런 걸 만듭니다"
      order="02"
      title="비즈니스 형태에 맞춰"
    >
      <div className={styles.grid} data-node-id="138:4510">
        {services.map((service) => (
          <ServiceCard key={service.headline} {...service} />
        ))}
      </div>
    </SectionShell>
  );
}
