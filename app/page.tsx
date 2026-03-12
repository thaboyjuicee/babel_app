import { BabelHome } from "@/components/babel/BabelHome";
import { getHomeData } from "@/server/services/home-data";

export const revalidate = 45;

export default async function Home() {
  const data = await getHomeData("1h");
  return <BabelHome {...data} />;
}
