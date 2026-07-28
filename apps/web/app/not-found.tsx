import Image from "next/image";
import Link from "next/link";

import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div className={styles.headerLayer}>
        <Header />
      </div>

      <section aria-labelledby="not-found-title" className={styles.hero}>
        <div className={styles.content}>
          <div aria-hidden="true" className={styles.visual}>
            <Image
              alt=""
              className={styles.illustration}
              height={240}
              priority
              src="/figma-assets/404-lost-page.svg"
              width={320}
            />
          </div>

          <div className={styles.copy}>
            <h1 className={styles.title} id="not-found-title">
              길을 잠시 잃으신 것 같아요
            </h1>
            <p className={styles.description}>
              요청하신 페이지가 사라졌거나 주소가 변경되었어요.
              <br /> 아래 메뉴에서 다시 시작해 주세요.
            </p>
          </div>

          <nav aria-label="404 페이지 이동" className={styles.actions}>
            <Link className={styles.primaryLink} href="/">
              홈으로 돌아가기
            </Link>
            <Link className={styles.secondaryLink} href="/portfolio">
              포트폴리오 둘러보기
            </Link>
          </nav>
        </div>
      </section>

      <Footer />
    </main>
  );
}
