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

// Hero button is conditional (enabled/disabled) in the component; keep the class list identical.
export const landingPageHeroAnalyzeButtonBase =
  `border-5 border-black px-12 py-6 text-2xl lg:text-3xl ${anton} uppercase ${shadow6} inline-flex items-center gap-4 ${roundedXl} transition-all`;
export const landingPageHeroAnalyzeButtonEnabled =
  `bg-[#FADF0B] hover:${shadow8} hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px] cursor-pointer`;
export const landingPageHeroAnalyzeButtonDisabled =
  'bg-gray-300 text-gray-600 cursor-not-allowed';

export const landingPageHeroButtonWrap = 'relative inline-block group';
export const landingPageHeroTooltipPos =
  'pointer-events-none absolute top-full mt-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity';
export const landingPageHeroTooltipBox = `bg-white ${b4} px-4 py-2 ${roundedMd} ${shadow4}`;
export const landingPageHeroTooltipText =
  `${space} font-semibold text-sm text-black whitespace-nowrap`;

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

export const featuresCardHeaderRow = "mb-6 flex items-center gap-4";
export const featuresCardHeaderLeft = "flex items-center gap-4";
export const featuresAuthorIconBox =
  `size-16 ${roundedXl} ${b5} flex items-center justify-center text-3xl`;
export const featuresIcon = "size-8 text-black";
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

/* =========================
    App Shell + Layout
========================= */

export const rootHtmlClass = "scroll-smooth";
export const rootBodyClass = "antialiased";

// Used by app-level route shells (landing/compare/dashboard fallbacks).
export const appShell = "size-full overflow-y-auto bg-[#F5F5F0]";
export const pageShell = "min-h-screen w-full overflow-y-auto bg-[#F5F5F0]";

export const pageFallbackContainer = `${maxW6} px-4 py-16`;
export const pageFallbackBadge =
  `inline-flex items-center ${roundedXl} ${b5} bg-white px-6 py-4 ${anton} text-2xl uppercase ${shadow6}`;

/* =========================
    Shared Condition Colors
========================= */

export const conditionBgExcellent = 'bg-[#00FF00]';
export const conditionBgGood = 'bg-[#FADF0B]';
export const conditionBgFair = 'bg-[#FF6600]';
export const conditionBgPoor = 'bg-[#FF0000]';

/* =========================
    Navigation
========================= */

export const navigationStyles = {
  root: 'bg-[#F5F5F0] px-6 py-6 shadow-[0px_6px_0px_0px_#000000]',
  inner: 'mx-auto flex w-full max-w-6xl items-center justify-between',
  brandRow: 'inline-flex items-center gap-3',
  brandText: `${bebas} text-3xl tracking-wide`,

  loadingPill:
    `inline-flex items-center gap-2 ${roundedMd} ${b4} bg-[#FADF0B] px-4 py-2 ${anton} text-sm uppercase ${shadow4}`,
  loadingIcon: 'size-4 animate-spin',

  rightRailBase: 'ml-auto items-center gap-3',
  rightRailDashboard: 'flex w-full max-w-3xl justify-end',
  rightRailInline: 'inline-flex',

  dashboardSearchShell:
    `w-full max-w-2xl overflow-hidden ${roundedXl} ${b4} bg-white ${shadow6}`,
  dashboardSearchInput:
    `w-full px-5 py-3 ${space} text-sm font-semibold outline-none placeholder:text-gray-400`,
  dashboardSearchButtonWrap: 'group relative inline-block',
  dashboardSearchButtonBase:
    `inline-flex items-center ${roundedXl} ${b4} p-3 ${shadow4} transition-all`,
  dashboardSearchButtonEnabled:
    'bg-[#FADF0B] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
  dashboardSearchButtonDisabled: 'cursor-not-allowed bg-gray-300 text-gray-600',
  dashboardSearchChevronIcon: 'size-5',

  dashboardSearchTooltipPos:
    'pointer-events-none absolute right-0 top-full z-50 mt-2 opacity-0 transition-opacity group-hover:opacity-100',
  dashboardSearchTooltipBox:
    `${roundedMd} ${b4} bg-white px-3 py-2 ${shadow4}`,
  dashboardSearchTooltipText:
    `whitespace-nowrap ${space} text-sm font-semibold text-black`,

  dashboardLink:
    `inline-flex items-center ${roundedMd} ${b4} bg-[#FF69B4] px-4 py-2 ${anton} text-sm uppercase ${shadow4} transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`,

  authLink:
    `inline-flex items-center ${roundedMd} ${b4} bg-[#FADF0B] px-4 py-2 ${anton} text-sm uppercase ${shadow4} transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`,

  logoutButton:
    `inline-flex items-center gap-2 whitespace-nowrap ${roundedMd} ${b4} bg-[#FF69B4] px-4 py-2 ${anton} text-sm uppercase ${shadow4} transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-70`,
  logoutIcon: 'size-4',
} as const;

/* =========================
    Auth Page
========================= */

export const authStyles = {
  page: 'min-h-screen bg-[#F5F5F0]',
  center: 'mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10',
  centerLoading: 'mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-4 py-10',

  checkingPill:
    `inline-flex items-center gap-3 ${roundedFull} ${b4} bg-white px-6 py-3 ${anton} uppercase ${shadow6}`,
  checkingIcon: 'size-5 animate-spin',

  backRow: 'mb-6',
  backLink:
    `inline-flex items-center gap-2 ${roundedFull} ${b4} bg-white px-4 py-2 ${anton} text-sm uppercase ${shadow4} transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`,
  backIcon: 'size-4',

  card: `${rounded3xl} ${b5} bg-white p-8 ${shadow10}`,
  title: `mb-8 text-center ${anton} text-5xl leading-[0.95] text-black`,

  supabaseMissingBox: `${roundedXl} ${b4} bg-[#FF69B4] p-4 ${shadow4} mb-6`,
  supabaseMissingText: `${space} text-sm font-bold text-black`,

  modeToggleWrap: `mb-8 inline-flex ${roundedFull} ${b4} bg-[#F5F5F0] p-1`,
  modeButtonBase: `${roundedFull} px-5 py-2 ${anton} text-sm uppercase transition-all`,
  modeButtonActiveLogin: 'bg-[#3300FF] text-white shadow-[3px_3px_0px_0px_#000000]',
  modeButtonActiveSignup: 'bg-[#FF69B4] text-black shadow-[3px_3px_0px_0px_#000000]',
  modeButtonInactive: 'text-black',

  form: 'space-y-4',
  label: 'block',
  labelText: `mb-2 block ${anton} text-sm uppercase`,
  inputRow: `flex items-center gap-3 ${b4} bg-white px-4 py-3`,
  inputIcon: 'size-5',
  input: `w-full ${space} font-semibold outline-none`,

  errorBox: `flex items-center gap-2 ${roundedXl} ${b4} bg-[#FF6600] p-3`,
  errorIcon: 'size-5 shrink-0 text-white',
  errorText: `${space} text-sm font-bold text-white`,

  successBox: `${roundedXl} ${b4} bg-[#90EE90] p-3`,
  successText: `${space} text-sm font-bold text-black`,

  submitButton:
    `mt-2 inline-flex w-full items-center justify-center ${roundedFull} ${b5} bg-[#3300FF] px-6 py-4 ${anton} text-lg uppercase text-white ${shadow6} transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none`,
  submitLoadingRow: 'inline-flex items-center gap-2',
  helperText: `text-center ${space} text-sm font-semibold text-gray-600`,
} as const;

/* =========================
    Dashboard
========================= */

export const dashboardStyles = {
  main: pageShell,

  signInOverlay: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
  signInCard: `relative bg-white ${b5} ${roundedXl} p-10 ${shadow8} max-w-md w-full mx-4`,
  signInCloseButton:
    'absolute top-4 right-4 rounded-md border-2 border-black p-1 transition-all hover:bg-gray-100',
  signInCloseIcon: 'size-5',
  signInTitle: `${anton} text-4xl uppercase text-black mb-4 text-center`,
  signInBody: `${space} text-base font-semibold text-gray-600 mb-8 text-center`,
  signInButtons: 'flex flex-col gap-3',
  signInPrimaryButton:
    `w-full ${roundedXl} ${b5} bg-[#FADF0B] px-6 py-4 ${shadow6} ${anton} text-xl uppercase text-black transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none`,
  signInSecondaryButton:
    `w-full ${roundedXl} border-4 border-black bg-white px-6 py-3 ${space} text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50`,

  previousListingsSection: 'border-t-4 border-b-4 border-black bg-[#FF6600] px-15 pt-15 pb-15',
  previousListingsCard:
    `bg-white ${b5} ${roundedXl} ${shadow8}`,
  previousListingsCardOpen: 'p-10',
  previousListingsCardClosed: 'px-10 py-6',
  previousListingsToggleButton: 'flex w-full items-center justify-between',
  previousListingsChevronIcon: 'size-8',
  previousListingsTitle: `${anton} text-5xl uppercase text-black`,
  previousListingsEmptyText: `${space} text-lg font-semibold text-black/60 mt-8`,

  previousListingsScrollerWrap: 'relative',
  previousListingsScroller:
    'flex snap-x snap-mandatory gap-6 overflow-x-auto no-scrollbar',

  previousListingCard:
    `relative min-w-[280px] max-w-[320px] flex-shrink-0 snap-start ${roundedXl} ${b5} bg-[#FF69B4] p-6 text-left ${shadow6} transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[8px_8px_0px_0px_#000000]`,
  previousListingButton: 'w-full text-left',
  previousListingTitle: `${anton} text-xl uppercase text-black line-clamp-1 pr-8`,
  previousListingUrl: `mt-1 break-all ${space} text-xs font-bold text-black/50`,
  previousListingCompareButton:
    `absolute top-3 right-3 flex size-7 items-center justify-center ${roundedFull} ${b5} shadow-[2px_2px_0px_0px_#000000] transition-all`,
  previousListingCompareSelected: 'bg-[#3300FF] text-white',
  previousListingCompareUnselected: 'bg-white text-black',
  previousListingCompareIcon: 'size-3.5',

  scrollIndicatorRow: 'mt-3 flex items-center justify-end gap-2',
  scrollIndicatorTrack: 'h-1.5 w-16 rounded-full bg-black/20 overflow-hidden',
  scrollIndicatorThumb: 'h-full w-1/3 rounded-full bg-black/60',
  scrollIndicatorText: `${anton} text-sm uppercase text-black/40`,

  activeAnalysisCol: 'flex flex-col',
  currentListingActionButtonBase:
    `${b5} ${roundedXl} px-4 py-2 ${shadow4} ${pressable} ${anton} text-sm uppercase`,
  currentListingActionBack: 'bg-[#3300FF] text-white',
  currentListingActionCompareSelected: 'bg-[#FF69B4] text-white',
  currentListingActionCompareUnselected: 'bg-[#FF69B4] text-black',

  accountSection: `${sectionBorderB4P15} bg-[#FADF0B]`,
  accountCard: `bg-white ${b5} ${roundedXl} p-10 ${shadow8}`,
  accountTitle: `${anton} text-5xl uppercase text-black mb-4`,
  accountBody: `mb-10 ${space} text-xl font-bold text-black/70`,
  accountGrid: 'grid gap-8 md:grid-cols-3',
  accountStatCardBase: `${roundedXl} ${b4} p-8 ${shadow4}`,
  accountStatBgUnlimited: 'bg-[#90EE90]',
  accountStatBgInsights: 'bg-[#FF69B4]',
  accountStatBgHistory: 'bg-[#FF6600]',
  accountStatTitle: `${anton} text-2xl uppercase text-black mb-2`,
  accountStatText: `${space} text-sm font-semibold`,
} as const;

export const analysisProgressStyles = {
  outer: 'p-20',
  card: `mx-auto max-w-2xl bg-white ${b5} ${roundedXl} p-10 ${shadow8}`,
  title: `${anton} text-3xl uppercase text-center mb-8`,
  row: 'flex items-center justify-between gap-3',
  stepCol: 'flex-1 flex flex-col',
  barBase: `h-4 ${b5} ${roundedXl} mb-2`,
  barDone: 'bg-[#90EE90]',
  barCurrent: 'bg-[#FADF0B] animate-pulse',
  barPending: 'bg-gray-200',
  labelBase: `${space} text-xs font-semibold`,
  labelDone: 'text-black',
  labelPending: 'text-gray-400',
} as const;

export const compareBarStyles = {
  root: 'fixed bottom-0 left-0 right-0 z-40',
  limitRow: 'flex justify-center pb-2',
  limitBox: `${b5} ${roundedXl} bg-[#FF6600] px-5 py-2 ${shadow4} animate-bounce`,
  limitText: `${anton} text-sm uppercase text-white`,
  barShell:
    'border-t-5 border-black bg-white px-6 py-4 shadow-[0px_-6px_0px_0px_#000000]',
  barInner: 'mx-auto flex max-w-6xl items-center justify-between gap-4',
  leftRow: 'flex items-center gap-3',
  chip:
    `flex items-center gap-2 bg-[#FADF0B] ${b5} ${roundedXl} px-3 py-2 ${shadow4}`,
  chipImage: 'size-8 rounded border-2 border-black object-cover',
  chipImageFallback:
    'flex size-8 items-center justify-center rounded border-2 border-black bg-gray-200',
  chipImageFallbackText: `${anton} text-xs`,
  chipTitle: `${space} text-sm font-semibold line-clamp-1 max-w-[120px]`,
  removeButton: 'ml-1 rounded-full p-0.5 transition-colors hover:bg-black/10',
  removeIcon: 'size-4',
  remainingText: `${space} text-sm font-semibold text-gray-500`,
  compareLink:
    `bg-[#FF69B4] ${b5} px-6 py-3 ${shadow6} ${roundedXl} ${pressable} text-black`,
  compareLinkText: `${anton} text-lg uppercase`,
  compareDisabled:
    `bg-gray-300 text-gray-500 cursor-not-allowed ${b5} px-6 py-3 ${roundedXl}`,
} as const;

export const currentListingStyles = {
  section: 'border-b-4 border-black bg-[#90EE90] px-15 pt-6 pb-15',
  card:
    `mx-auto flex w-full max-w-6xl items-stretch justify-between gap-20 ${roundedXl} ${b5} bg-white p-6 ${shadow8}`,
  imageWrap: `flex-[1] overflow-hidden ${roundedXl} ${b5}`,
  image: 'h-full w-full object-cover',
  content: 'flex min-w-0 flex-[2] flex-col justify-between p-6',
  titlePriceRow: 'mb-3 flex items-start justify-between gap-4',
  title:
    `line-clamp-3 break-words text-[clamp(1.5rem,4vw,4.5rem)] leading-[0.9] tracking-tight text-white ${bebas}`,
  priceBox:
    `${roundedXl} ${b5} bg-[#FF69B4] px-4 py-2 ${shadow4} transition-all`,
  priceText: `${anton} text-3xl text-black`,
  description:
    `mb-4 text-center text-base font-semibold leading-relaxed text-gray-700 ${space}`,
  metaRow: 'mb-4 flex flex-wrap gap-3',
  locationChip:
    `flex items-center gap-2 ${roundedXl} ${b5} bg-[#FADF0B] px-3 py-2 ${shadow4} transition-all`,
  locationIcon: 'size-4',
  locationText: `text-center font-semibold text-black ${space}`,
  timeChip:
    `flex items-center gap-2 ${roundedXl} ${b5} bg-[#FF6600] px-3 py-2 ${shadow4} transition-all`,
  timeIcon: 'size-4',
  timeText: `text-center font-semibold text-black ${space}`,
  conditionChipBase:
    `inline-flex items-center ${roundedXl} ${b5} px-3 py-2 ${shadow4} transition-all`,
  conditionText: `text-sm font-bold uppercase text-black ${space}`,
  actionsRow: 'mt-4 flex flex-wrap items-center gap-3',
} as const;

export const pricingAnalysisStyles = {
  section: `${sectionBorderB4P15} bg-[#FADF0B]`,
  topGrid:
    `mx-auto mb-12 grid w-full max-w-6xl grid-cols-1 items-center justify-between gap-8 md:grid-cols-3`,
  statBgSuggestedOffer: 'bg-[#90EE90]',
  statBgModelAccuracy: 'bg-[#FF69B4]',
  statBgMarketValue: 'bg-[#FF6600]',
  // Subtle emphasis without changing layout flow (transform/shadow don't affect grid sizing).
  suggestedOfferEmphasis: 'relative z-10 -translate-y-2 shadow-[14px_14px_0px_0px_#000000] text-black',
  // Make the value the focal point while preserving alignment/spacing.
  suggestedOfferValueEmphasis: 'text-4xl sm:text-5xl font-black text-black tracking-tight',
  statCardBase:
    `rounded-xl ${b5} shadow-[6px_6px_0px_0px_#000000] transition-all duration-200 flex min-h-[180px] flex-col justify-center p-8 text-center`,
  statValueRow:
    `flex h-[56px] items-center justify-center text-4xl leading-none font-semibold text-gray-700 ${space} whitespace-nowrap tabular-nums`,
  statTitle: `mb-3 text-center text-3xl text-black ${anton}`,
  statValue: `text-center text-3xl font-semibold text-gray-700 ${space}`,

  whyTitle: `mb-3 text-center text-3xl text-black ${anton}`,
  reasonsGrid:
    `mx-auto mb-12 grid w-full max-w-6xl grid-cols-1 items-center justify-between gap-8 md:grid-cols-2`,
  reasonCard:
    `rounded-xl ${b5} shadow-[6px_6px_0px_0px_#000000] transition-all duration-200 flex items-center gap-6 bg-white p-6`,
  reasonNumber:
    `flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${b4} bg-black text-2xl font-black text-white`,
  reasonText: `text-center text-base font-semibold text-gray-700 ${space}`,

  tipWrap: 'mx-auto w-full max-w-6xl',
  tipTitle: `mb-3 text-center text-3xl text-black ${anton}`,
  tipCard:
    `rounded-xl ${b5} shadow-[6px_6px_0px_0px_#000000] transition-all duration-200 bg-white p-8`,
  tipText: `text-center text-base font-semibold text-gray-700 ${space}`,
} as const;

export const similarListingsStyles = {
  section: 'border-b-4 border-black bg-[#3300FF] p-15',
  container: 'mx-auto w-full max-w-6xl',
  frame:
    `relative ${roundedXl} ${b5} bg-white p-8 ${shadow8}`,
  title: boldFontCentered,
  row:
    'mb-6 flex snap-x snap-mandatory gap-6 overflow-x-auto no-scrollbar items-stretch',
  itemWrap: 'w-[calc((100%_-_2*1.5rem)/3)] flex-shrink-0 snap-start flex',
  swipeHint:
    `text-center text-sm text-gray-400 ${anton} uppercase tracking-widest`,
} as const;

export const listingCardStyles = {
  root:
    `flex w-full h-full flex-col items-center ${roundedXl} ${b5} bg-[#FADF0B] p-6 text-center ${shadow6} transition-all`,

  priceBox:
    `mb-6 ${roundedXl} ${b5} bg-[#90EE90] px-6 py-3 ${shadow4} transition-all`,
  priceText: `${anton} text-3xl text-black uppercase`,

  imageWrap:
    `relative mb-6 h-44 w-full overflow-hidden ${roundedXl} ${b5} bg-white`,
  image: 'h-full w-full object-cover',
  compareOverlayButtonBase:
    `absolute top-2 right-2 flex size-8 items-center justify-center ${roundedFull} ${b5} shadow-[2px_2px_0px_0px_#000000] transition-all`,
  compareOverlaySelected: 'bg-[#FF69B4] text-white',
  compareOverlayUnselected: 'bg-white text-black',
  overlayIcon: 'size-4',

  title: `${anton} text-3xl mb-3 text-center text-black`,
  location: `${space} font-semibold text-gray-700 text-center`,

  actionsRow: 'mt-auto flex gap-2 w-full pt-6',
  actionColWrap: 'min-w-0 transition-all duration-300 ease-in-out',
  actionFlexDefault: 'flex-1',
  actionFlexExpanded: 'flex-[3]',
  actionFlexCollapsed: 'flex-[0_0_2.5rem]',

  actionLinkBase:
    `flex items-center justify-center h-full text-white ${b5} py-3 ${shadow4} ${roundedXl} ${pressable} overflow-hidden transition-all duration-300`,
  actionLinkBallerBg: 'bg-[#FF6600]',
  actionLinkCompareBg: 'bg-[#FF69B4]',
  actionPadDefault: 'px-4',
  actionPadCollapsed: 'px-0',

  actionInner:
    'transition-opacity duration-200 overflow-hidden',
  actionInnerVisible: 'opacity-100',
  actionInnerHidden: 'opacity-0 w-0',
  actionLabel: `${anton} text-base uppercase text-center block whitespace-nowrap`,
  actionSubRow: 'flex items-center justify-center gap-1 mt-1',
  actionSubIcon: 'size-3',
  actionSubText: `${space} text-xs font-semibold whitespace-nowrap`,

  facebookLink:
    `mt-2 flex w-full items-center justify-center gap-2 bg-[#3300FF] text-white ${b5} py-3 px-4 ${shadow4} ${roundedXl} ${pressable}`,
  facebookText: `${anton} text-base uppercase whitespace-nowrap`,
  facebookIcon: 'size-4',
} as const;

/* =========================
    Compare
========================= */

export const compareStyles = {
  main: 'min-h-screen bg-[#F5F5F0] px-4 py-8',
  container: 'mx-auto max-w-6xl',
  breadcrumb:
    `inline-flex items-center gap-2 mb-8 ${space} text-sm font-bold text-black hover:underline`,
  breadcrumbIcon: 'size-4',

  sameListingCard:
    `bg-[#FADF0B] ${b5} ${roundedXl} ${shadow6} p-8 text-center`,
  sameListingTitle: `${anton} text-2xl uppercase mb-2`,
  sameListingBody: `${space} text-base font-semibold text-gray-700`,

  contentCol: 'flex flex-col gap-8',
  grid: 'grid grid-cols-1 md:grid-cols-2 gap-8',

  errorCard:
    `bg-white ${b5} ${roundedXl} ${shadow6} p-8 flex flex-col items-center justify-center gap-4 min-h-[300px]`,
  errorTitle: `${anton} text-xl uppercase text-black`,
  errorBody: `${space} text-sm font-semibold text-gray-600 text-center`,
  errorRetryButton:
    `bg-[#FF6600] ${b5} ${roundedXl} px-6 py-3 ${shadow6} ${anton} text-base uppercase text-white inline-flex items-center gap-2 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[8px_8px_0px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all`,
  errorRetryIcon: 'size-4',
} as const;

export const diffSummaryStyles = {
  root: `${b5} ${roundedXl} bg-white p-6 ${shadow6} mx-auto max-w-6xl`,
  title: `${anton} text-2xl uppercase mb-4`,
  chipRow: 'flex flex-wrap items-center gap-3',
  priceChip: `bg-[#90EE90] ${b5} ${roundedXl} px-4 py-2 ${shadow4}`,
  conditionChip: `bg-[#FADF0B] ${b5} ${roundedXl} px-4 py-2 ${shadow4}`,
  chipText: `${space} text-sm font-bold`,
} as const;

export const priceComparisonStyles = {
  root: 'flex items-center justify-between gap-4',
  side:
    `bg-white ${b5} ${shadow4} ${roundedXl} px-4 py-2 flex items-center gap-2`,
  arrowGreen: 'size-5 text-[#00FF00]',
  arrowRed: 'size-5 text-[#FF0000]',
  priceText: `${anton} text-xl text-black`,
  diffBadge: `bg-[#FADF0B] ${b5} ${shadow4} ${roundedXl} px-4 py-2`,
  diffText: `${space} text-sm font-bold`,
} as const;

export const conditionComparisonStyles = {
  root: 'grid grid-cols-2 gap-6',
  headerRow: 'flex items-center justify-between mb-2',
  label: `${space} text-sm font-bold uppercase`,
  pct: `${space} text-sm font-bold`,
  bar: `h-4 w-full ${b5} ${roundedXl} bg-gray-200 overflow-hidden`,
  fillBase: 'h-full transition-all duration-500',
  na: `${space} text-sm font-bold text-gray-400`,
} as const;

export const prosConsStyles = {
  wrap: 'flex flex-wrap gap-2',
  chipBase: `${b5} ${roundedXl} ${shadow4} px-3 py-1.5 inline-flex items-center gap-1.5`,
  chipProBg: 'bg-[#90EE90]',
  chipConBg: 'bg-[#FF6600]',
  icon: 'size-3.5',
  iconCon: 'size-3.5 text-white',
  labelBase: `${space} text-xs font-bold`,
  labelCon: 'text-white',
  shimmerA:
    `${b5} ${roundedXl} ${shadow4} px-3 py-1.5 bg-gray-200 animate-pulse inline-flex items-center gap-1.5 h-[30px] w-[100px]`,
  shimmerB:
    `${b5} ${roundedXl} ${shadow4} px-3 py-1.5 bg-gray-200 animate-pulse inline-flex items-center gap-1.5 h-[30px] w-[120px]`,
} as const;

export const columnSkeletonStyles = {
  root:
    `bg-white ${b5} ${roundedXl} ${shadow6} overflow-hidden flex flex-col animate-pulse`,
  image: 'w-full h-[200px] bg-gray-200',
  body: 'p-5 flex flex-col gap-4',
  title: 'h-8 w-3/4 bg-gray-200 rounded',
  price: 'h-10 w-32 bg-gray-200 rounded-xl',
  condition: 'h-16 w-full bg-gray-200 rounded-xl',
  statsGrid: 'grid grid-cols-3 gap-2',
  stat: 'h-16 bg-gray-200 rounded-xl',
  reasonsTitle: 'h-5 w-40 bg-gray-200 rounded',
  reasonsCol: 'flex flex-col gap-2',
  reason: 'h-12 bg-gray-200 rounded-xl',
  tipTitle: 'h-5 w-32 bg-gray-200 rounded',
  tip: 'h-12 bg-gray-200 rounded-xl',
} as const;

export const verdictCardStyles = {
  shell: `bg-white ${b5} ${roundedXl} ${shadow6} p-8`,
  skeleton: 'animate-pulse space-y-4',
  skeletonLineLg: 'h-8 bg-gray-200 rounded w-3/4',
  skeletonLineSm: 'h-4 bg-gray-200 rounded w-full',
  skeletonLineMd: 'h-4 bg-gray-200 rounded w-5/6',
  errorText: `${space} text-sm font-semibold text-gray-400 text-center`,

  rootBase:
    `${b5} ${roundedXl} ${shadow6} p-8 transition-all duration-700`,
  revealed: 'opacity-100 translate-y-0',
  hidden: 'opacity-0 translate-y-4',
  headerRow: 'flex items-center gap-3 mb-4',
  icon: 'size-8',
  title: `${anton} text-2xl uppercase`,
  body: `${space} text-base font-semibold text-gray-700`,
  tieBg: 'bg-[#FADF0B]',
  winBg: 'bg-[#90EE90]',
} as const;

export const comparisonColumnStyles = {
  rootBase:
    `bg-white ${roundedXl} ${shadow6} overflow-hidden flex flex-col transition-all duration-700`,
  rootWinner:
    'border-5 border-[#00FF00] shadow-[0_0_20px_rgba(0,255,0,0.3)]',
  imageShell: `w-full h-[200px] ${b5} ${roundedXl} overflow-hidden m-[-1px]`,
  image: 'w-full h-full object-cover',
  imageFallback: 'w-full h-full bg-gray-200 flex items-center justify-center',
  imageFallbackText: `${space} text-sm font-semibold text-gray-400`,

  body: 'p-5 flex flex-col gap-4',
  title: `${anton} text-2xl uppercase text-black`,
  priceRow: 'flex items-center gap-3 flex-wrap',
  priceBadge: `bg-[#FF69B4] ${b5} ${shadow4} px-4 py-2 ${roundedXl}`,
  priceText: `${anton} text-xl text-black`,

  conditionBadge:
    `${b5} ${shadow4} ${roundedXl} px-4 py-3`,
  conditionHeaderRow: 'flex items-center justify-between mb-1',
  conditionLabel: `${space} text-sm font-bold uppercase`,
  conditionPct: `${space} text-sm font-semibold`,
  conditionBar:
    'h-3 w-full rounded-full bg-white/50 overflow-hidden border-2 border-black',
  conditionBarFill: 'h-full bg-black/30 transition-all duration-500',

  statsGrid: 'grid grid-cols-3 gap-2',
  statCardBase: `${b5} ${roundedXl} p-3 text-center`,
  statBgSuggestedOffer: 'bg-[#90EE90]',
  statBgMarketValue: 'bg-[#FF69B4]',
  statBgAccuracy: 'bg-[#FF6600]',
  statLabel: `${anton} text-xs uppercase mb-1`,
  statValue: `${space} text-sm font-bold`,
  statValueWhite: `${space} text-sm font-bold text-white`,

  sectionTitle: `${anton} text-lg uppercase text-black mb-2`,
  reasonsCol: 'flex flex-col gap-2',
  reasonCard: `bg-white ${b5} ${roundedXl} p-3 flex items-center gap-3`,
  reasonNumber:
    'flex-shrink-0 w-8 h-8 rounded-lg border-3 border-black bg-black text-white flex items-center justify-center text-sm font-black',
  reasonText: `${space} text-sm font-semibold text-gray-700`,
  tipCard: `bg-white ${b5} ${roundedXl} p-3`,
  tipText: `${space} text-sm font-semibold text-gray-700`,
} as const;
