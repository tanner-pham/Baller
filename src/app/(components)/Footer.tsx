"use client";


export function Footer() {
  const productLinks = [
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' }
  ];

  const resourceLinks = [
    { name: 'Documentation', href: '#docs' },
    { name: 'GitHub', href: '#github' },
    { name: 'Support', href: '#support' }
  ];

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-black text-white border-t-5 border-black">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="font-['Anton',sans-serif] text-3xl tracking-tight">
                BALLER
              </span>
            </div>
            <p className="font-['Space_Grotesk',sans-serif] text-gray-400 font-medium mb-6">
              Make smarter marketplace decisions with AI-powered analysis.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-['Anton',sans-serif] text-xl mb-4 text-[#FF6600] tracking-wide">
              PRODUCT
            </h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="font-['Space_Grotesk',sans-serif] font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-['Anton',sans-serif] text-xl mb-4 text-[#FF69B4] tracking-wide">
              RESOURCES
            </h3>
            <ul className="space-y-3">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="font-['Space_Grotesk',sans-serif] font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t-4 border-gray-800 pt-8 text-center">
          <p className="font-['Space_Grotesk',sans-serif] text-gray-400 font-medium">
            © 2026 Baller. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
