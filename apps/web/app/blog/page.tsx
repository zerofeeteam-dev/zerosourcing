import { getPublishedBlogPosts } from "../../lib/public-content/queries";
import { selectBlogIndex } from "../../lib/public-content/selectors";
import { BlogListClient } from "./BlogListClient";

export const revalidate = 86400;

export default async function BlogPage() {
  const rows = await getPublishedBlogPosts();
  const { featured, list, top } = selectBlogIndex(rows);

  return <BlogListClient featured={featured} items={list} top={top} />;
}
