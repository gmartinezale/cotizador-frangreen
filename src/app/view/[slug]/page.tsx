import { connectDB } from "@/lib/mongo";
import Quoter from "@/models/quoter";
import QuoterPDFView from "@/components/template/Quoter/QuoterPDFView";
import { notFound } from "next/navigation";

interface ViewQuoterPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ViewQuoterPage({ params }: ViewQuoterPageProps) {
  const { slug } = await params;
  
  // Parse slug: "cotizacion-1001" → 1001
  const match = slug.match(/^cotizacion-(\d+)$/);
  if (!match) {
    notFound();
  }

  const quoterNumber = parseInt(match[1], 10);

  await connectDB();

  const quoter = await Quoter.findOne({ quoterNumber })
    .populate("products.product", "name")
    .lean();

  if (!quoter) {
    notFound();
  }

  // Serialize the data
  const quoterData = JSON.parse(JSON.stringify(quoter));

  return <QuoterPDFView quoter={quoterData} />;
}
