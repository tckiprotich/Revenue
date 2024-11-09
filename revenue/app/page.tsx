import Link from 'next/link';
export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="grid grid-cols-1 gap-8 justify-items-center">
        <h1 className="text-4xl font-bold text-center text-[#333]">Revenue</h1>
        <p className="text-lg text-center text-[#666]">
          This is a revenue page.
        </p>
      </div>   
      <Link href="/pay" className="btn btn-primary">
        Pay now   
      </Link>

    </div>
  );
}
