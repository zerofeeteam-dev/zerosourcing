import type { Metadata } from "next";

import { LiquidGlassSwitcher } from "./LiquidGlassSwitcher";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Liquid Glass Switcher | Zerosourcing",
  description: "A three-theme liquid glass switcher reproduction.",
};

export default function LiquidGlassPage() {
  return (
    <main className={styles.page}>
      <LiquidGlassSwitcher />

      <article className={styles.article}>
        <h1 className={styles.title}>Liquid glass</h1>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui maxime
          optio quam debitis autem, maiores odio tenetur dicta aperiam aliquam,
          iusto nisi ipsum tempore dolore doloremque facere non culpa sint sequi
          ducimus corporis veritatis cumque corrupti sed. Ipsa dolor quod alias
          dicta dolores. Ducimus pariatur nostrum quo, impedit facilis
          voluptatibus. Non doloremque, facere neque dolorem animi earum odio
          placeat quae voluptatem nisi nihil deleniti voluptatibus harum magnam
          adipisci tenetur.
        </p>

        <figure className={styles.figure}>
          <div
            aria-label="Green translucent shapes on a yellow background"
            className={`${styles.figureImage} ${styles.figureImageFirst}`}
            role="img"
          />
          <figcaption className={styles.caption}>
            Photo by Neeqolah Creative Works on Unsplash
          </figcaption>
        </figure>

        <p>
          Sit amet consectetur adipisicing elit. Quibusdam illum in voluptates
          omnis reprehenderit inventore perferendis dolores, architecto
          doloribus. Quam error qui nam quis! Dolorum, dolore saepe ipsam quae
          aliquam tenetur dolores dolor repellendus facere a quasi soluta
          voluptate provident earum cum. Nostrum consequuntur corporis quibusdam
          tempora amet, animi inventore dicta voluptas nisi placeat ut illum
          explicabo. Consequatur, accusamus.
        </p>

        <blockquote className={styles.quote}>
          Et aliquam libero deserunt maxime! Perspiciatis neque deserunt sequi
          deleniti!
        </blockquote>

        <p>
          Recusandae doloribus, ullam inventore esse culpa cupiditate dignissimos
          qui ducimus possimus ipsum reprehenderit, suscipit debitis nihil sit.
          Animi eligendi sed molestiae. Repellat, est ut eos voluptates tempora
          quisquam corporis mollitia, excepturi commodi cum dolore asperiores
          eaque debitis fuga quidem. A laborum ab reiciendis saepe rerum iste.
        </p>

        <h2 className={styles.subtitle}>Doloremque nisi eius quis</h2>
        <p>
          Magnam quo voluptate vitae voluptatem expedita vel illum ut. Tempore,
          sed? Sunt distinctio minus dolore, consequuntur eos qui eveniet error
          rerum tempora, autem et quaerat, ea repellendus unde iure. Fuga ad
          tempore cupiditate animi iste, eius nam beatae, aliquid quae id iusto
          perspiciatis.
        </p>

        <figure className={styles.figure}>
          <div
            aria-label="Abstract violet and orange shapes"
            className={`${styles.figureImage} ${styles.figureImageSecond}`}
            role="img"
          />
          <figcaption className={styles.caption}>
            Photo by Irene Demetri on Unsplash
          </figcaption>
        </figure>

        <p>
          Quod iste recusandae sed labore corporis ea provident debitis hic
          maxime placeat alias rem cumque animi explicabo laboriosam, dicta
          molestias? Corporis quibusdam, aliquam asperiores quo officia
          reiciendis nemo aspernatur similique voluptatibus in tempora? Laborum
          temporibus ipsa at exercitationem ullam labore tempore neque.
        </p>

        <p className={styles.box}>
          Perspiciatis sapiente eum velit inventore illum accusamus eos at esse
          mollitia debitis quae rem odit, ipsam nam. Voluptas beatae, velit
          voluptatum dolor obcaecati a nobis consequuntur quis id eaque!
        </p>

        <h2 className={styles.subtitle}>Quod voluptas aliquid id saepe</h2>
        <p>
          Et minima quas amet! Debitis commodi consectetur laborum fugit
          voluptatum qui distinctio, natus odit obcaecati. Voluptate suscipit
          consectetur, aspernatur ratione impedit minus facilis voluptatum
          tempora nesciunt pariatur ipsa provident qui distinctio ad quasi
          magnam exercitationem itaque.
        </p>
        <p>
          Eos dolore dicta delectus dolorum porro fuga modi, perferendis natus
          ratione repellendus sit harum sint! Numquam quas facere quod doloribus
          enim omnis earum maxime perferendis ipsam magnam quos culpa, vitae,
          tenetur quisquam, unde quis maiores. Perspiciatis!
        </p>
      </article>
    </main>
  );
}
