import {
  footerRoot,
  footerContainer,
  footerGrid,
  footerBrandRow,
  footerBrandText,
  footerBrandDescription,
  footerColumnTitleProduct,
  footerColumnTitleResources,
  footerLinkList,
  footerLink,
  footerBottomBar,
  footerCopyright,
} from '../consts';

export function Footer() {
  const productLinks = [
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Features', href: '#features' },
    { name: 'Learn More', href: '#learn-more'}
  ];

  const resourceLinks = [
    { name: 'Living Document', href: 'https://docs.google.com/document/d/1Ne9dMbzxdo1actxRgpeopU2VFmHr2Dr3ZVr-e0mSXKc/edit?tab=t.0' },
    { name: 'GitHub', href: 'https://github.com/tanner-pham/Baller' },
  ];

  return (
    <footer className={footerRoot}>
      <div className={footerContainer}>
        <div className={footerGrid}>
          {/* Brand Column */}
          <div>
            <div className={footerBrandRow}>
              <span className={footerBrandText}>
                BALLER
              </span>
            </div>
            <p className={footerBrandDescription}>
              Make smarter marketplace decisions with AI-powered analysis.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className={footerColumnTitleProduct}>
              PRODUCT
            </h3>
            <ul className={footerLinkList}>
              {productLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className={footerLink}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className={footerColumnTitleResources}>
              RESOURCES
            </h3>
            <ul className={footerLinkList}>
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className={footerLink}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={footerBottomBar}>
          <p className={footerCopyright}>
            © 2026 Baller. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
