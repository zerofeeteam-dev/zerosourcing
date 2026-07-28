import { getPublishedPortfolios } from "../../lib/public-content/queries";
import { selectPortfolioIndex } from "../../lib/public-content/selectors";
import { PortfolioListClient } from "./PortfolioListClient";

export const revalidate = 86400;

export default async function PortfolioPage() {
  const rows = await getPublishedPortfolios();
  const { featured, list } = selectPortfolioIndex(rows);

  return <PortfolioListClient featured={featured} items={list} />;
}
