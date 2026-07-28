import Link from "next/link";

import styles from "./Breadcrumb.module.css";

type BreadcrumbItem = {
  readonly name: string;
  readonly path: string;
};

type BreadcrumbProps = {
  readonly items: readonly BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="breadcrumb" className={styles.breadcrumb}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isCurrentPage = index === items.length - 1;

          return (
            <li className={styles.item} key={item.path}>
              {isCurrentPage ? (
                <span aria-current="page">{item.name}</span>
              ) : (
                <Link className={styles.link} href={item.path}>
                  {item.name}
                </Link>
              )}
              {!isCurrentPage && <span aria-hidden="true"> / </span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
