import Link from "next/link";
import { categories } from "@/data/events";

export function CategorySection() {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Discover by Category
            </h2>
            <p className="text-zinc-500 mt-1 text-sm">
              Find the perfect race for your experience level
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/events?category=${cat.id}`}
              className="group"
            >
              <div className="p-5 rounded-lg bg-[#F4F4F5] border border-zinc-100 hover:border-zinc-200 transition-colors">
                <h3 className="font-semibold text-zinc-900 text-sm tracking-tight">
                  {cat.name}
                </h3>
                <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                  {cat.description}
                </p>
                <p className="text-zinc-400 text-xs mt-3">
                  {cat.count} {cat.count === 1 ? "event" : "events"} &rarr;
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
