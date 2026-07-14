import Image from "next/image";

import styles from "./ManagedThumbnail.module.css";

type ManagedThumbnailProps = {
  readonly alt: string;
  readonly className: string;
  readonly sizes: string;
  readonly url: string | null;
};

export function ManagedThumbnail({
  alt,
  className,
  sizes,
  url,
}: ManagedThumbnailProps) {
  return (
    <div className={`${className} ${styles.frame}`}>
      {url ? (
        <Image
          alt={alt}
          className={styles.image}
          fill
          sizes={sizes}
          src={url}
        />
      ) : null}
    </div>
  );
}
