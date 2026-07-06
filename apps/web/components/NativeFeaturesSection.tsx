import { Icon, type IconName } from "./Icon";
import { SectionShell } from "./SectionShell";
import styles from "./NativeFeaturesSection.module.css";

type NativeFeature = {
  description: string;
  iconName: IconName;
  title: string;
};

const nativeFeatures: NativeFeature[] = [
  {
    description: "재방문을 높이는 맞춤 알림 전송",
    iconName: "bell-02",
    title: "푸시 알림",
  },
  {
    description: "카드·간편결제·인앱 구매 연동",
    iconName: "card-02",
    title: "결제·인앱결제",
  },
  {
    description: "GPS 기반 위치·길찾기·주변 검색",
    iconName: "map-02",
    title: "지도·위치",
  },
  {
    description: "사진 촬영·QR·바코드 스캔",
    iconName: "camera-lens",
    title: "카메라·QR",
  },
  {
    description: "카카오·네이버·애플 간편 로그인",
    iconName: "user-profile-03",
    title: "소셜 로그인",
  },
  {
    description: "기기·태그·결제 단말과 직접 연동",
    iconName: "component",
    title: "블루투스·NFC",
  },
  {
    description: "사진·문서 업로드와 저장",
    iconName: "image-03",
    title: "파일·갤러리",
  },
  {
    description: "OS 네이티브 공유 시트 연동",
    iconName: "share",
    title: "공유하기",
  },
];

export function NativeFeaturesSection() {
  return (
    <SectionShell
      className={styles.section}
      description="React Native 패키징으로 아래 기능을 그대로 씁니다. 사용자는 하이브리드인지 알아채지 못합니다."
      label="앱 네이티브 기능"
      order="03"
      title={
        <>
          React Native로 구현하는
          <br />
          네이티브 기능
        </>
      }
    >
      <div className={styles.grid} data-node-id="50:4639">
        {nativeFeatures.map((feature) => (
          <article className={styles.card} key={feature.title}>
            <div className={styles.heading}>
              <span className={styles.iconFrame} aria-hidden="true">
                <Icon name={feature.iconName} size={24} />
              </span>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
            </div>
            <p className={styles.cardDescription}>{feature.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
