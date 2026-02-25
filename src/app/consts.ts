/**
 * Shared UI style constants for progressive design-system consolidation.
 * This module is intentionally retained even when some exports are not yet consumed.
 */

/* =========================
    Common Fonts + Text
========================= */


export const anton = "font-['Anton',sans-serif]";
export const space = "font-['Space_Grotesk',sans-serif]";
export const bebas = "font-['Bebas_Neue',sans-serif]";

export const largeBoldFont = `${anton} text-6xl lg:text-7xl mb-4 text-black`;
export const boldFontCentered = `${largeBoldFont} text-center pb-7`;

// Common section subtext (used in HowItWorks + Features)
export const sectionSubText =
  `${space} text-xl font-bold text-gray-700 max-w-2xl mx-auto`;

/* =========================
    Common Layout + Shapes
========================= */

export const container = "container mx-auto px-4";
export const maxW4 = "max-w-4xl mx-auto";
export const maxW5 = "max-w-5xl mx-auto";
export const maxW6 = "max-w-6xl mx-auto";
export const maxW6Full = "mx-auto w-full max-w-6xl";

export const roundedMd = "rounded-md";
export const roundedXl = "rounded-xl";
export const rounded2xl = "rounded-2xl";
export const rounded3xl = "rounded-3xl";
export const roundedFull = "rounded-full";

/* =========================
    Common Borders + Shadows
========================= */

export const b2 = "border-2 border-black";
export const b4 = "border-4 border-black";
export const b5 = "border-5 border-black";

export const shadow4 = "shadow-[4px_4px_0px_0px_#000000]";
export const shadow6 = "shadow-[6px_6px_0px_0px_#000000]";
export const shadow8 = "shadow-[8px_8px_0px_0px_#000000]";
export const shadow10 = "shadow-[10px_10px_0px_0px_#000000]";

export const hoverLift = `hover:${shadow8} hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all`;
export const press = `active:shadow-none active:translate-x-[6px] active:translate-y-[6px]`;
export const pressable = `${hoverLift} ${press}`;

export const cardBase = `bg-white ${b5}`;
export const cardHover2xl = `${cardBase} p-8 ${shadow6} ${hoverLift} ${rounded2xl}`;
export const badgeBase = `${b5} ${roundedMd} ${shadow4}`;

/* =========================
    Common Sections
========================= */

export const sectionBase = "relative overflow-hidden";
export const sectionBorderB5 = "border-b-5 border-black";
export const sectionBorderB4P15 = "border-b-4 border-black p-15";

// Large landing sections (HowItWorks / Features / FinalCTA)
const sectionLg = `${sectionBase} py-20 lg:py-32 ${sectionBorderB5}`;
// Hero section
const sectionHero = `${sectionBase} py-12 lg:py-16 ${sectionBorderB5}`;

/* =========================
    Shadows
========================= */

export const textShadowStyle = {
  textShadow:
    '6px 6px 0px #000000, -2px -2px 0px #000000, 2px -2px 0px #000000, -2px 2px 0px #000000',
  WebkitTextStroke: '3px black',
};

/* =========================
    LandingPage: Hero
========================= */

export const landingPageHeader =
  `${bebas} text-7xl sm:text-8xl lg:text-9xl text-white leading-[0.9] tracking-tight`;

export const landingPagesubText =
  `${space} text-xl lg:text-2xl font-bold text-white max-w-3xl mx-auto`;

export const landingPageHeroSection = `${sectionHero} bg-[#3300FF]`;
export const landingPageHeroContainer = `${container} relative z-10`;
export const landingPageHeroInner = `${maxW5} text-center space-y-8`;
export const landingPageHeroHeadlineGroup = "space-y-4";
export const landingPageHeroInputGroup = "space-y-4 max-w-3xl mx-auto";
export const landingPageHeroInputShell = `${cardBase} ${shadow8} ${roundedFull} overflow-hidden`;

export const landingPageHeroInput =
  `w-full px-8 py-6 text-lg ${space} font-semibold outline-none placeholder:text-gray-400`;

const btnBase = `${b5} ${anton} uppercase ${shadow6} ${pressable}`;
export const landingPageHeroAnalyzeButton =
  `bg-[#FADF0B] px-12 py-6 text-2xl lg:text-3xl ${btnBase} inline-flex items-center gap-4 ${roundedXl}`;

export const landingPageHeroChevronIcon = "size-8";

/* =========================
    LandingPage: HowItWorks
========================= */

export const howItWorksSection = `${sectionLg} bg-[#FFFFFF]`;
export const howItWorksContainer = container;
export const howItWorksHeader = "text-center mb-16";
export const howItWorksSubText = sectionSubText;
export const howItWorksGrid = `grid grid-cols-1 md:grid-cols-3 gap-8 ${maxW6}`;

export const howItWorksCard = `${cardHover2xl} relative`;
export const howItWorksNumberBadge =
  `absolute -top-4 -left-4 size-12 ${roundedFull} ${b5} flex items-center justify-center ${anton} text-2xl`;

export const howItWorksIconRow = "mb-6 flex justify-center";
export const howItWorksIconBox =
  `size-20 ${rounded2xl} ${b5} flex items-center justify-center`;
export const howItWorksIcon = "size-10";
export const howItWorksStepTitle = `${anton} text-3xl mb-3 text-center`;
export const howItWorksStepDescription = `${space} font-semibold text-gray-700 text-center`;

/* =========================
    LandingPage: Features
========================= */

export const featuresSection = `${sectionLg} bg-[#90EE90]`;
export const featuresContainer = container;
export const featuresHeader = howItWorksHeader;
export const featuresSubText = sectionSubText;
export const featuresGrid = `grid grid-cols-1 md:grid-cols-2 gap-6 ${maxW6}`;
export const featuresCard = cardHover2xl;

export const featuresCardHeaderRow = "flex items-center justify-between mb-6";
export const featuresCardHeaderLeft = "flex items-center gap-4";
export const featuresAuthorIconBox =
  `size-16 ${roundedXl} ${b5} flex items-center justify-center text-3xl`;
export const featuresTitle = `${anton} text-2xl`;
export const featuresDescription = `${space} font-semibold text-gray-700 mb-6`;

/* =========================
    LandingPage: FinalCTA
========================= */

export const finalCTASection = `${sectionLg} bg-[#FADF0B]`;
export const finalCTAContainer = container;
export const finalCTAInner = maxW4;

export const finalCTACard =
  `${cardBase} p-12 lg:p-16 ${shadow10} ${rounded3xl} text-center`;

export const finalCTATitle =
  `${anton} text-5xl lg:text-6xl mb-6 leading-tight text-black`;

export const finalCTASubText =
  `${space} text-xl lg:text-2xl font-bold mb-10 text-gray-700`;

export const finalCTAButtonRow =
  "flex flex-col sm:flex-row gap-4 justify-center items-center";

export const finalCTAPrimaryButton =
  `bg-[#3300FF] text-white px-10 py-5 text-xl lg:text-2xl ${btnBase} inline-flex items-center gap-3 ${roundedXl}`;

export const finalCTAButtonIcon = "size-7";

export const finalCTASecondaryButton =
  `bg-white text-black px-10 py-5 text-xl lg:text-2xl ${btnBase} ${roundedXl}`;

/* =========================
    LandingPage: Footer
========================= */

export const footerRoot = "bg-black text-white border-t-5 border-black";
export const footerContainer = `${container} py-16`;
export const footerGrid = "grid md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12";
export const footerBrandRow = "flex items-center gap-3 mb-6";
export const footerBrandText = `${anton} text-3xl tracking-tight`;
export const footerBrandDescription = `${space} text-gray-400 font-medium mb-6`;
export const footerColumnTitleProduct = `${anton} text-xl mb-4 text-[#FF6600] tracking-wide`;
export const footerColumnTitleResources = `${anton} text-xl mb-4 text-[#FF69B4] tracking-wide`;
export const footerLinkList = "space-y-3";
export const footerLink = `${space} font-medium text-gray-400 hover:text-white transition-colors`;
export const footerBottomBar = "border-t-4 border-gray-800 pt-8 text-center";
export const footerCopyright = `${space} text-gray-400 font-medium`;

/* =========================
    Dashboard: CurrentListing
========================= */

export const currentListingRoot = `${sectionBorderB4P15} bg-[#90EE90]`;
export const currentListingCard =
  `${maxW6Full} flex h-[500px] items-stretch justify-between gap-20`;

export const currentListingImageWrapper =
  `flex-[1] ${b5} overflow-hidden ${roundedXl}`;
export const currentListingImage = "w-full h-full object-cover";

export const currentListingContent =
  "flex-[2] p-6 flex flex-col justify-between min-w-0";

export const currentListingTitlePriceRow =
  "flex items-start justify-between gap-4 mb-3";

export const currentListingTitle =
  `${bebas} text-[clamp(2rem,6vw,6rem)] leading-[0.9] tracking-tight line-clamp-2 break-words text-white`;

export const currentListingPriceBox =
  `bg-[#FF69B4] ${b5} px-4 py-2 ${shadow4} ${roundedMd}`;
export const currentListingPriceText = `${anton} text-3xl text-black`;

export const currentListingDescription =
  `${space} font-semibold text-gray-700 text-center mb-4 text-base leading-relaxed`;

export const currentListingMetaRow = "flex flex-wrap gap-3 mb-4";

export const currentListingLocationBox =
  `bg-[#FADF0B] ${b5} px-3 py-2 flex items-center gap-2 ${roundedMd}`;
export const currentListingLocationIcon = "size-4";
export const currentListingLocationText =
  `${space} font-semibold text-gray-700 text-center`;

export const currentListingTimeBox =
  `bg-[#FF6600] ${b5} px-3 py-2 ${roundedMd}`;
export const currentListingTimeText =
  `${space} font-semibold text-white text-center`;

export const currentListingConditionBadgeBase = `${b2} px-2 py-1`;
export const currentListingConditionText = "font-bold text-xs";

export const currentListingSellerSection = "border-t-5 border-black pt-8";
export const currentListingSellerPill =
  `inline-flex items-center gap-2 bg-[#3300FF] ${b5} px-4 py-2 ${shadow4} ${roundedMd}`;
export const currentListingSellerIcon = "size-4 text-white";
export const currentListingSellerName =
  `${space} font-semibold text-white text-center`;

/* =========================
    Dashboard: ListingCard
========================= */

export const listingCardRoot =
  `bg-[#FADF0B] p-6 ${b5} ${roundedXl} ${shadow6} transition-all flex flex-col items-center text-center cursor-pointer`;

export const listingCardPriceBox =
  `bg-[#90EE90] ${b5} px-6 py-3 mb-6 ${shadow4} ${roundedMd}`;
export const listingCardPriceText = `${anton} text-3xl text-black uppercase`;

export const listingCardImageWrapper =
  `w-full h-44 bg-white ${b5} mb-6 overflow-hidden ${roundedMd}`;
export const listingCardImage = "w-full h-full object-cover";

export const listingCardTitle = `${anton} text-3xl mb-3 text-center text-black`;
export const listingCardLocation =
  `${space} font-semibold text-gray-700 text-center mb-6`;

export const listingCardCtaBox =
  `bg-[#3300FF] text-white ${b5} px-6 py-3 ${shadow4} ${roundedMd} ${pressable}`;
export const listingCardCtaText = `${anton} text-base uppercase text-center`;

/* =========================
    Dashboard: PricingAnalysis
========================= */

export const pricingAnalysisCardBase =
  `${b4} ${shadow6} transition-all duration-200 ${roundedMd}`;

export const pricingAnalysisRoot = `${sectionBorderB4P15} bg-[#FADF0B]`;

export const pricingAnalysisTopStatsGrid =
  `grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 ${maxW6Full} items-center justify-between`;

export const pricingAnalysisStatCard = "p-8 text-center";
export const pricingAnalysisStatTitle =
  `${anton} text-3xl mb-3 text-center text-black`;
export const pricingAnalysisStatValue =
  `${space} font-semibold text-gray-700 text-center text-3xl`;

export const pricingAnalysisWhyTitle = pricingAnalysisStatTitle;

export const pricingAnalysisReasonsGrid =
  `grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 ${maxW6Full} items-center justify-between`;

export const pricingAnalysisReasonCard =
  `bg-white p-6 flex items-center gap-6 ${pricingAnalysisCardBase}`;

export const pricingAnalysisReasonNumber =
  `bg-black text-white text-2xl w-16 h-16 flex items-center justify-center shrink-0 font-black ${roundedMd}`;

export const pricingAnalysisReasonText =
  `${space} font-semibold text-gray-700 text-center text-base`;

export const pricingAnalysisNegotiationRow =
  `flex flex-col md:flex-row items-stretch gap-6 ${maxW6Full} items-center justify-between`;

export const pricingAnalysisLearnMoreButton =
  `bg-[#3300FF] text-white px-10 text-lg ${anton} flex items-center justify-center ${pricingAnalysisCardBase} ${pressable}`;

export const pricingAnalysisNegotiationCol = "flex-1";
export const pricingAnalysisNegotiationTipTitle = pricingAnalysisStatTitle;

export const pricingAnalysisTipCard =
  `bg-white p-8 ${pricingAnalysisCardBase}`;

export const pricingAnalysisTipText =
  `${space} font-semibold text-gray-700 text-center text-base`;

/* =========================
    Dashboard: SimilarListings
========================= */

export const similarListingsSection = `${sectionBorderB4P15} bg-[#3300FF]`;
export const similarListingsContainer = maxW6Full;

export const similarListingsFrame =
  `${cardBase} p-8 pb-20 ${roundedXl} ${shadow8} relative`;

export const similarListingsRow =
  "flex gap-8 snap-x snap-mandatory overflow-x-auto no-scrollbar mb-6";

export const similarListingsCardWrapper =
  "flex-shrink-0 w-[calc((100% - 3*2rem)/4)] snap-start";

export const similarListingsSwipeIndicatorPos = "absolute bottom-6 right-7";
export const similarListingsSwipeIndicatorBox =
  `bg-[#FF69B4] px-6 py-3 ${badgeBase}`;
export const similarListingsSwipeIndicatorText =
  `${anton} text-base uppercase text-center text-black`;

