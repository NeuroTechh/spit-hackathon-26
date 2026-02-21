import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-100">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          <div>
            <p className="font-semibold text-zinc-900 tracking-tight mb-1">
              Piston Cup
            </p>
            <p className="text-sm text-zinc-400">
              Premium motorsport events platform
            </p>
          </div>

          <div className="flex gap-10">
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Discover
              </p>
              {["Night Races", "Championships", "Street Circuits"].map(
                (item) => (
                  <Link
                    key={item}
                    href="/events"
                    className="block text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    {item}
                  </Link>
                )
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Platform
              </p>
              {["How It Works", "Get Verified", "Reputation"].map((item) => (
                <span
                  key={item}
                  className="block text-sm text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-100 flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            &copy; 2026 Piston Cup. All rights reserved.
          </p>
          <p className="text-xs text-zinc-300">
            Powered by Hudson Identity Protocol
          </p>
        </div>
      </div>
    </footer>
  );
}
