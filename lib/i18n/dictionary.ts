import type { Locale, LocalizedText } from "@/types/common";

/**
 * Static storefront chrome strings that aren't backed by admin-entered
 * content (nav/footer labels already live in constants/nav.ts as
 * LocalizedText) — buttons, CTAs, and labels repeated across many pages.
 * Deliberately scoped to the highest-visibility strings rather than every
 * string in the app; admin-entered content (product names, descriptions,
 * etc.) is resolved separately via `pickLocalized`.
 */
export const STOREFRONT_DICTIONARY = {
  bookAVisit: { en: "Book a Visit", hi: "विज़िट बुक करें", mr: "भेट बुक करा" },
  callUs: { en: "Call", hi: "कॉल करें", mr: "कॉल करा" },
  wishlist: { en: "Wishlist", hi: "विशलिस्ट", mr: "विशलिस्ट" },
  signIn: { en: "Sign In", hi: "साइन इन करें", mr: "साइन इन करा" },
  account: { en: "Account", hi: "खाता", mr: "खाते" },
  more: { en: "More", hi: "अधिक", mr: "अधिक" },
  addToCart: { en: "Add to Cart", hi: "कार्ट में डालें", mr: "कार्टमध्ये टाका" },
  reserveThisPiece: {
    en: "Reserve This Piece",
    hi: "यह पीस आरक्षित करें",
    mr: "हा दागिना राखीव ठेवा",
  },
  whatsappEnquiry: {
    en: "WhatsApp Enquiry",
    hi: "व्हाट्सएप पूछताछ",
    mr: "व्हॉट्सअॅप चौकशी",
  },
  enquire: { en: "Enquire", hi: "पूछताछ करें", mr: "चौकशी करा" },
  allRightsReserved: {
    en: "All rights reserved.",
    hi: "सर्वाधिकार सुरक्षित।",
    mr: "सर्व हक्क राखीव.",
  },
  chooseLanguage: { en: "Language", hi: "भाषा", mr: "भाषा" },
  searchPlaceholder: {
    en: "Search for jewellery...",
    hi: "ज्वेलरी खोजें...",
    mr: "दागिने शोधा...",
  },
  recentlyViewed: {
    en: "Recently Viewed",
    hi: "हाल ही में देखे गए",
    mr: "अलीकडे पाहिलेले",
  },
  youMayAlsoLike: {
    en: "You May Also Like",
    hi: "आपको यह भी पसंद आ सकता है",
    mr: "तुम्हाला हे देखील आवडेल",
  },

  // --- Search (header-search.tsx) ---
  searchByNameTagSku: {
    en: "Search by name, tag, or SKU...",
    hi: "नाम, टैग या SKU से खोजें...",
    mr: "नाव, टॅग किंवा SKU ने शोधा...",
  },
  clearSearch: { en: "Clear search", hi: "खोज साफ़ करें", mr: "शोध साफ करा" },
  clear: { en: "Clear", hi: "साफ़ करें", mr: "साफ करा" },
  noResultsFor: { en: "No results for", hi: "इसके लिए कोई परिणाम नहीं", mr: "यासाठी कोणतेही निकाल नाहीत" },
  tryOneOfTheseInstead: {
    en: "Try one of these instead",
    hi: "इनमें से कोई एक आज़माएं",
    mr: "यापैकी एखादे वापरून पहा",
  },
  recentSearches: { en: "Recent Searches", hi: "हाल की खोजें", mr: "अलीकडील शोध" },
  continueBrowsing: { en: "Continue Browsing", hi: "ब्राउज़िंग जारी रखें", mr: "ब्राउझिंग सुरू ठेवा" },
  popularSearches: { en: "Popular Searches", hi: "लोकप्रिय खोजें", mr: "लोकप्रिय शोध" },
  trendingProducts: { en: "Trending Products", hi: "ट्रेंडिंग उत्पाद", mr: "ट्रेंडिंग उत्पादने" },
  priceOnRequest: { en: "Price on request", hi: "कीमत पूछताछ पर", mr: "किंमत विनंतीवर" },
  searchTryCategoryHint: {
    en: 'Try searching for a category like "bridal" or a metal type like "gold".',
    hi: '"ब्राइडल" जैसी श्रेणी या "गोल्ड" जैसी धातु खोजने का प्रयास करें।',
    mr: '"ब्राइडल" सारखी श्रेणी किंवा "गोल्ड" सारखा धातू शोधून पहा.',
  },
  showingXOfYRefine: {
    en: "refine your search to narrow it down.",
    hi: "इसे सीमित करने के लिए अपनी खोज को परिष्कृत करें।",
    mr: "अधिक अचूक करण्यासाठी तुमचा शोध सुधारा.",
  },

  // --- Homepage sections ---
  browse: { en: "Browse", hi: "ब्राउज़ करें", mr: "ब्राउझ करा" },
  shopByCollection: {
    en: "Shop by Collection",
    hi: "कलेक्शन के अनुसार खरीदें",
    mr: "कलेक्शननुसार खरेदी करा",
  },
  shopByCollectionDesc: {
    en: "Curated groupings to help you find the right piece faster — from bridal sets to everyday gold.",
    hi: "सही आभूषण जल्दी खोजने में मदद के लिए चुनी हुई श्रेणियाँ — ब्राइडल सेट से लेकर रोज़मर्रा के सोने तक।",
    mr: "योग्य दागिना पटकन शोधण्यासाठी निवडक गट — ब्राइडल सेटपासून रोजच्या सोन्यापर्यंत.",
  },
  collectionEyebrow: { en: "Collection", hi: "कलेक्शन", mr: "कलेक्शन" },
  browseByType: { en: "Browse by Type", hi: "प्रकार के अनुसार ब्राउज़ करें", mr: "प्रकारानुसार ब्राउझ करा" },
  findYourPerfectMatch: {
    en: "Find Your Perfect Match",
    hi: "अपनी पसंद का आभूषण खोजें",
    mr: "तुमची आवडती वस्तू शोधा",
  },
  findYourPerfectMatchDesc: {
    en: "Every piece in our catalogue, organized the way our showroom is — by type, not by trend.",
    hi: "हमारे कैटलॉग का हर आभूषण, हमारे शोरूम की तरह ही व्यवस्थित — प्रकार के अनुसार, ट्रेंड के अनुसार नहीं।",
    mr: "आमच्या कॅटलॉगमधील प्रत्येक दागिना, आमच्या शोरूमप्रमाणेच मांडलेला — प्रकारानुसार, ट्रेंडनुसार नाही.",
  },
  categoriesToChooseFrom: {
    en: "Categories to choose from",
    hi: "चुनने के लिए श्रेणियाँ",
    mr: "निवडण्यासाठी श्रेण्या",
  },
  viewAll: { en: "View All", hi: "सभी देखें", mr: "सर्व पहा" },
  madeForYou: { en: "Made For You", hi: "आपके लिए बनाया गया", mr: "तुमच्यासाठी बनवलेले" },
  onlineExclusive: { en: "Online Exclusive", hi: "ऑनलाइन एक्सक्लूसिव", mr: "ऑनलाइन एक्सक्लुझिव्ह" },
  onlineExclusiveDesc: {
    en: "Handcrafted to order — reserve yours online and it's made especially for you.",
    hi: "ऑर्डर पर हस्तनिर्मित — इसे ऑनलाइन आरक्षित करें और यह खास आपके लिए बनाया जाएगा।",
    mr: "ऑर्डरनुसार हाताने बनवलेले — ऑनलाइन राखीव करा आणि ते खास तुमच्यासाठी बनवले जाईल.",
  },
  shopEyebrow: { en: "Shop", hi: "खरीदारी", mr: "खरेदी" },
  ourCompleteCollection: {
    en: "Our Complete Collection",
    hi: "हमारा पूरा कलेक्शन",
    mr: "आमचा संपूर्ण कलेक्शन",
  },
  ourCompleteCollectionDesc: {
    en: "Every piece we carry, from everyday gold to statement bridal sets.",
    hi: "रोज़मर्रा के सोने से लेकर खास ब्राइडल सेट तक, हमारे पास मौजूद हर आभूषण।",
    mr: "रोजच्या सोन्यापासून खास ब्राइडल सेटपर्यंत, आमच्याकडील प्रत्येक दागिना.",
  },
  viewAllProducts: { en: "View All Products", hi: "सभी उत्पाद देखें", mr: "सर्व उत्पादने पहा" },
  justIn: { en: "Just In", hi: "अभी आया", mr: "नुकतेच आले" },
  newArrivals: { en: "New Arrivals", hi: "नई आवक", mr: "नवीन आगमन" },
  newArrivalsDesc: {
    en: "The latest pieces added to our catalogue, freshest first.",
    hi: "हमारे कैटलॉग में जोड़े गए नवीनतम आभूषण, सबसे नए सबसे पहले।",
    mr: "आमच्या कॅटलॉगमध्ये नव्याने समाविष्ट झालेले दागिने, सर्वात नवीन आधी.",
  },
  styleGuide: { en: "Style Guide", hi: "स्टाइल गाइड", mr: "स्टाइल मार्गदर्शक" },
  waysToWearIt: { en: "Ways to Wear It", hi: "पहनने के तरीके", mr: "परिधान करण्याचे मार्ग" },
  ourStoryEyebrow: { en: "Our Story", hi: "हमारी कहानी", mr: "आमची कथा" },
  ourStoryTitle: {
    en: "A trusted name in Roha, presented anew",
    hi: "रोहा में एक भरोसेमंद नाम, नए रूप में",
    mr: "रोहामधील विश्वासार्ह नाव, नव्या रूपात",
  },
  ourStoryBody: {
    en: "Shree Ambika Jewellers has served families across Roha with honest pricing and genuine craftsmanship. This site is a new way to browse what we offer — the trust is the same trust you'd find walking through our doors.",
    hi: "श्री अंबिका ज्वेलर्स ईमानदार कीमत और असली कारीगरी के साथ रोहा के परिवारों की सेवा करता आ रहा है। यह साइट हमारे उत्पाद देखने का एक नया तरीका है — भरोसा वही है जो आपको हमारे दरवाज़े से अंदर आते ही मिलेगा।",
    mr: "श्री अंबिका ज्वेलर्स प्रामाणिक किंमत आणि खऱ्या कारागिरीने रोहामधील कुटुंबांची सेवा करत आहे. ही साइट आमचे उत्पादन पाहण्याचा एक नवा मार्ग आहे — विश्वास तोच आहे जो आमच्या दुकानात पाऊल ठेवताच मिळेल.",
  },
  readOurStory: { en: "Read Our Story", hi: "हमारी कहानी पढ़ें", mr: "आमची कथा वाचा" },
  shreeAmbikaExperience: {
    en: "Shree Ambika Experience",
    hi: "श्री अंबिका अनुभव",
    mr: "श्री अंबिका अनुभव",
  },
  findUsReachUsLearnFromUs: {
    en: "Find Us, Reach Us, Learn From Us",
    hi: "हमें ढूंढें, हमसे जुड़ें, हमसे सीखें",
    mr: "आम्हाला शोधा, आमच्याशी संपर्क करा, आमच्याकडून जाणून घ्या",
  },
  whatFamiliesSay: { en: "What Families Say", hi: "परिवार क्या कहते हैं", mr: "कुटुंबे काय म्हणतात" },
  lovedAcrossGenerations: {
    en: "Loved Across Generations",
    hi: "पीढ़ियों से पसंद किया गया",
    mr: "पिढ्यानपिढ्या आवडलेले",
  },
  visitOurStore: { en: "Visit Our Store", hi: "हमारे स्टोर पर आएं", mr: "आमच्या स्टोअरला भेट द्या" },
  bookAnAppointment: { en: "Book an Appointment", hi: "अपॉइंटमेंट बुक करें", mr: "अपॉइंटमेंट बुक करा" },
  talkToAnExpert: { en: "Talk to an Expert", hi: "विशेषज्ञ से बात करें", mr: "तज्ज्ञांशी बोला" },
  readOurJournal: { en: "Read Our Journal", hi: "हमारी जर्नल पढ़ें", mr: "आमचे जर्नल वाचा" },
  jewelleryCareGuide: { en: "Jewellery Care Guide", hi: "आभूषण देखभाल गाइड", mr: "दागिने काळजी मार्गदर्शक" },
  hallmarkAndCertification: {
    en: "Hallmark & Certification",
    hi: "हॉलमार्क और प्रमाणीकरण",
    mr: "हॉलमार्क आणि प्रमाणपत्र",
  },
  bisHallmarked: { en: "BIS Hallmarked", hi: "BIS हॉलमार्क प्राप्त", mr: "BIS हॉलमार्कयुक्त" },
  bisHallmarkedDetail: {
    en: "Every gold piece certified",
    hi: "हर सोने का आभूषण प्रमाणित",
    mr: "प्रत्येक सोन्याचा दागिना प्रमाणित",
  },
  transparentPricing: { en: "Transparent Pricing", hi: "पारदर्शी कीमत", mr: "पारदर्शक किंमत" },
  transparentPricingDetail: {
    en: "Live rate, no hidden charges",
    hi: "लाइव रेट, कोई छिपा शुल्क नहीं",
    mr: "लाइव्ह दर, कोणतेही छुपे शुल्क नाही",
  },
  estLocalTrust: { en: "Est. Local Trust", hi: "स्थापित स्थानीय भरोसा", mr: "स्थापित स्थानिक विश्वास" },
  estLocalTrustDetail: {
    en: "Generations of Roha families",
    hi: "रोहा के परिवारों की पीढ़ियां",
    mr: "रोहामधील कुटुंबांच्या पिढ्या",
  },
  handpickedCraft: { en: "Handpicked Craft", hi: "चुनिंदा कारीगरी", mr: "निवडक कारागिरी" },
  handpickedCraftDetail: {
    en: "Bridal to everyday fine jewellery",
    hi: "ब्राइडल से रोज़मर्रा के आभूषण तक",
    mr: "ब्राइडलपासून रोजच्या दागिन्यांपर्यंत",
  },

  // --- Product listing / detail ---
  home: { en: "Home", hi: "होम", mr: "होम" },
  products: { en: "Products", hi: "उत्पाद", mr: "उत्पादने" },
  featured: { en: "Featured", hi: "फीचर्ड", mr: "फीचर्ड" },
  bestSeller: { en: "Best Seller", hi: "बेस्ट सेलर", mr: "बेस्ट सेलर" },
  trending: { en: "Trending", hi: "ट्रेंडिंग", mr: "ट्रेंडिंग" },
  newArrival: { en: "New Arrival", hi: "नई आवक", mr: "नवीन आगमन" },
  madeToOrder: { en: "Made to Order", hi: "ऑर्डर पर निर्मित", mr: "ऑर्डरनुसार बनवलेले" },
  noImageYet: { en: "No image yet", hi: "अभी कोई तस्वीर नहीं", mr: "अद्याप फोटो नाही" },
  skuLabel: { en: "SKU:", hi: "SKU:", mr: "SKU:" },
  specifications: { en: "Specifications", hi: "विनिर्देश", mr: "तपशील" },
  theJourneyOfThisPiece: {
    en: "The Journey of This Piece",
    hi: "इस आभूषण की यात्रा",
    mr: "या दागिन्याचा प्रवास",
  },
  reserveThisPieceLower: { en: "Reserve This Piece", hi: "यह पीस आरक्षित करें", mr: "हा दागिना राखीव ठेवा" },
  loadMore: { en: "Load More", hi: "और देखें", mr: "आणखी पहा" },
  filters: { en: "Filters", hi: "फ़िल्टर", mr: "फिल्टर्स" },
  clearAllFilters: { en: "Clear All Filters", hi: "सभी फ़िल्टर हटाएं", mr: "सर्व फिल्टर्स काढा" },
  collections: { en: "Collections", hi: "कलेक्शन", mr: "कलेक्शन्स" },
  categories: { en: "Categories", hi: "श्रेणियाँ", mr: "श्रेण्या" },
  priceRange: { en: "Price Range", hi: "मूल्य सीमा", mr: "किंमत श्रेणी" },
  metalType: { en: "Metal Type", hi: "धातु प्रकार", mr: "धातू प्रकार" },
  weightGrams: { en: "Weight (grams)", hi: "वज़न (ग्राम)", mr: "वजन (ग्रॅम)" },
  availability: { en: "Availability", hi: "उपलब्धता", mr: "उपलब्धता" },
  newArrivalsOnly: { en: "New Arrivals Only", hi: "केवल नई आवक", mr: "फक्त नवीन आगमन" },
  min: { en: "Min", hi: "न्यूनतम", mr: "किमान" },
  max: { en: "Max", hi: "अधिकतम", mr: "कमाल" },
  availableInShowroom: {
    en: "Available in Showroom",
    hi: "शोरूम में उपलब्ध",
    mr: "शोरूममध्ये उपलब्ध",
  },
  reserved: { en: "Reserved", hi: "आरक्षित", mr: "राखीव" },
  results: { en: "results", hi: "परिणाम", mr: "निकाल" },
  showResults: { en: "Show Results", hi: "परिणाम दिखाएं", mr: "निकाल दाखवा" },
  metal: { en: "Metal", hi: "धातु", mr: "धातू" },
  purity: { en: "Purity", hi: "शुद्धता", mr: "शुद्धता" },
  grossWeight: { en: "Gross Weight", hi: "सकल वज़न", mr: "एकूण वजन" },
  netWeight: { en: "Net Weight", hi: "शुद्ध वज़न", mr: "निव्वळ वजन" },
  makingCharge: { en: "Making Charge", hi: "मेकिंग चार्ज", mr: "मेकिंग चार्ज" },
  viewFullDetails: { en: "View Full Details", hi: "पूरा विवरण देखें", mr: "पूर्ण तपशील पहा" },

  // --- Cart / Checkout ---
  yourCart: { en: "Your Cart", hi: "आपकी कार्ट", mr: "तुमची कार्ट" },
  signInToViewCart: {
    en: "Sign in to view your cart and check out.",
    hi: "अपनी कार्ट देखने और चेकआउट करने के लिए साइन इन करें।",
    mr: "तुमची कार्ट पाहण्यासाठी आणि चेकआउट करण्यासाठी साइन इन करा.",
  },
  yourCartIsEmpty: { en: "Your cart is empty.", hi: "आपकी कार्ट खाली है।", mr: "तुमची कार्ट रिकामी आहे." },
  browseProducts: { en: "Browse Products", hi: "उत्पाद ब्राउज़ करें", mr: "उत्पादने ब्राउझ करा" },
  orderSummary: { en: "Order Summary", hi: "ऑर्डर सारांश", mr: "ऑर्डर सारांश" },
  subtotal: { en: "Subtotal", hi: "सबटोटल", mr: "उपएकूण" },
  shipping: { en: "Shipping", hi: "शिपिंग", mr: "शिपिंग" },
  free: { en: "Free", hi: "मुफ़्त", mr: "मोफत" },
  gstLabel: { en: "GST", hi: "जीएसटी", mr: "जीएसटी" },
  discount: { en: "Discount", hi: "छूट", mr: "सवलत" },
  grandTotal: { en: "Grand Total", hi: "कुल योग", mr: "एकूण रक्कम" },
  proceedToCheckout: { en: "Proceed to Checkout", hi: "चेकआउट करें", mr: "चेकआउट करा" },
  placeOrder: { en: "Place Order", hi: "ऑर्डर दें", mr: "ऑर्डर द्या" },
  orderConfirmed: { en: "Order Confirmed", hi: "ऑर्डर की पुष्टि हुई", mr: "ऑर्डरची पुष्टी झाली" },
  orderConfirmedDesc: {
    en: "Thank you — your payment was successful and your order is being processed.",
    hi: "धन्यवाद — आपका भुगतान सफल रहा और आपका ऑर्डर संसाधित किया जा रहा है।",
    mr: "धन्यवाद — तुमचे पेमेंट यशस्वी झाले असून तुमची ऑर्डर प्रक्रियेत आहे.",
  },
  trackOrder: { en: "Track Order", hi: "ऑर्डर ट्रैक करें", mr: "ऑर्डर ट्रॅक करा" },
  continueShopping: { en: "Continue Shopping", hi: "खरीदारी जारी रखें", mr: "खरेदी सुरू ठेवा" },

  // --- Account / Auth ---
  myAccount: { en: "My Account", hi: "मेरा खाता", mr: "माझे खाते" },
  profile: { en: "Profile", hi: "प्रोफ़ाइल", mr: "प्रोफाइल" },
  myOrders: { en: "My Orders", hi: "मेरे ऑर्डर", mr: "माझ्या ऑर्डर्स" },
  myReservations: { en: "My Reservations", hi: "मेरे आरक्षण", mr: "माझी आरक्षणे" },
  savedAddresses: { en: "Saved Addresses", hi: "सहेजे गए पते", mr: "जतन केलेले पत्ते" },
  signedInWithGoogle: {
    en: "Signed in with Google",
    hi: "Google से साइन इन",
    mr: "Google ने साइन इन केले",
  },
  signUp: { en: "Sign Up", hi: "साइन अप करें", mr: "साइन अप करा" },
  signOut: { en: "Sign Out", hi: "साइन आउट करें", mr: "साइन आउट करा" },
  createAccount: { en: "Create Account", hi: "खाता बनाएं", mr: "खाते तयार करा" },
  forgotPassword: { en: "Forgot password?", hi: "पासवर्ड भूल गए?", mr: "पासवर्ड विसरलात?" },
  newHere: { en: "New here?", hi: "नए हैं?", mr: "नवीन आहात?" },
  alreadyHaveAnAccount: {
    en: "Already have an account?",
    hi: "पहले से खाता है?",
    mr: "आधीच खाते आहे?",
  },
  continueWithGoogle: {
    en: "Continue with Google",
    hi: "Google से जारी रखें",
    mr: "Google सह सुरू ठेवा",
  },
  orContinueWithEmail: {
    en: "Or continue with email",
    hi: "या ईमेल से जारी रखें",
    mr: "किंवा ईमेलने सुरू ठेवा",
  },
  fullName: { en: "Full name", hi: "पूरा नाम", mr: "पूर्ण नाव" },
  phoneNumber: { en: "Phone number", hi: "फ़ोन नंबर", mr: "फोन नंबर" },
  emailOptional: { en: "Email (optional)", hi: "ईमेल (वैकल्पिक)", mr: "ईमेल (ऐच्छिक)" },
  password: { en: "Password", hi: "पासवर्ड", mr: "पासवर्ड" },
  resetPassword: { en: "Reset Password", hi: "पासवर्ड रीसेट करें", mr: "पासवर्ड रीसेट करा" },
  backToSignIn: { en: "Back to Sign In", hi: "साइन इन पर वापस जाएं", mr: "साइन इनकडे परत जा" },
  haventPlacedOrders: {
    en: "You haven't placed any orders yet.",
    hi: "आपने अभी तक कोई ऑर्डर नहीं दिया है।",
    mr: "तुम्ही अद्याप कोणतीही ऑर्डर दिलेली नाही.",
  },
  haventBookedVisit: {
    en: "You haven't booked a visit yet.",
    hi: "आपने अभी तक कोई विज़िट बुक नहीं की है।",
    mr: "तुम्ही अद्याप कोणतीही भेट बुक केलेली नाही.",
  },

  // --- Reservation ---
  bookAPrivateViewing: {
    en: "Book a Private Viewing",
    hi: "एक निजी अपॉइंटमेंट बुक करें",
    mr: "खासगी भेटीची वेळ बुक करा",
  },
  reserveYourVisit: { en: "Reserve Your Visit", hi: "अपनी विज़िट आरक्षित करें", mr: "तुमची भेट राखीव करा" },
  fullNameLabel: { en: "Full name", hi: "पूरा नाम", mr: "पूर्ण नाव" },
  preferredDate: { en: "Preferred date", hi: "पसंदीदा तारीख", mr: "पसंतीची तारीख" },
  preferredTime: { en: "Preferred time", hi: "पसंदीदा समय", mr: "पसंतीची वेळ" },
  chooseASlot: { en: "Choose a slot", hi: "एक स्लॉट चुनें", mr: "एक स्लॉट निवडा" },
  branch: { en: "Branch", hi: "शाखा", mr: "शाखा" },
  chooseABranch: { en: "Choose a branch", hi: "एक शाखा चुनें", mr: "एक शाखा निवडा" },
  piecesYoudLikeToSee: {
    en: "Pieces you'd like to see (optional)",
    hi: "जो आभूषण आप देखना चाहेंगे (वैकल्पिक)",
    mr: "तुम्हाला पाहायचे असलेले दागिने (ऐच्छिक)",
  },
  messageOptional: { en: "Message (optional)", hi: "संदेश (वैकल्पिक)", mr: "संदेश (ऐच्छिक)" },
  requestReservation: { en: "Request Reservation", hi: "आरक्षण अनुरोध करें", mr: "आरक्षणाची विनंती करा" },
  bookANewVisit: { en: "Book a New Visit", hi: "नई विज़िट बुक करें", mr: "नवीन भेट बुक करा" },
  cancel: { en: "Cancel", hi: "रद्द करें", mr: "रद्द करा" },

  // --- Common ---
  callUsLabel: { en: "Call", hi: "कॉल करें", mr: "कॉल करा" },
  followUsOnInstagram: {
    en: "Follow us on Instagram",
    hi: "इंस्टाग्राम पर हमें फॉलो करें",
    mr: "इंस्टाग्रामवर आम्हाला फॉलो करा",
  },
  followUsOnFacebook: {
    en: "Follow us on Facebook",
    hi: "फेसबुक पर हमें फॉलो करें",
    mr: "फेसबुकवर आम्हाला फॉलो करा",
  },
  chatOnWhatsApp: {
    en: "Chat with us on WhatsApp",
    hi: "WhatsApp पर हमसे बात करें",
    mr: "WhatsApp वर आमच्याशी गप्पा करा",
  },
  callUsAriaLabel: { en: "Call us", hi: "हमें कॉल करें", mr: "आम्हाला कॉल करा" },
  googleReviews: { en: "Google reviews", hi: "Google समीक्षाएं", mr: "Google पुनरावलोकने" },
  skipToContent: { en: "Skip to content", hi: "सामग्री पर जाएं", mr: "मजकुराकडे जा" },
  backToTop: { en: "Back to top", hi: "ऊपर वापस जाएं", mr: "वर परत जा" },
  tryAgain: { en: "Try again", hi: "पुनः प्रयास करें", mr: "पुन्हा प्रयत्न करा" },
  sectionCouldntLoad: {
    en: "This section couldn't load.",
    hi: "यह भाग लोड नहीं हो सका।",
    mr: "हा विभाग लोड होऊ शकला नाही.",
  },
  loading: { en: "Loading", hi: "लोड हो रहा है", mr: "लोड होत आहे" },
  seeItInPerson: { en: "See it in person", hi: "इसे खुद देखें", mr: "स्वतः पाहा" },
  seeItInPersonDesc: {
    en: "Photos never do fine jewellery justice. Book a private viewing or drop by the Roha showroom — no obligation, just a closer look.",
    hi: "तस्वीरें कभी भी बेहतरीन आभूषणों को पूरा न्याय नहीं दे पातीं। एक निजी विज़िट बुक करें या रोहा शोरूम पर आएं — कोई बाध्यता नहीं, बस करीब से देखें।",
    mr: "फोटो कधीच उत्तम दागिन्यांना न्याय देऊ शकत नाहीत. खासगी भेटीची वेळ बुक करा किंवा रोहा शोरूमला भेट द्या — कोणतीही बांधिलकी नाही, फक्त जवळून पाहा.",
  },
} as const satisfies Record<string, LocalizedText>;

export type StorefrontDictionaryKey = keyof typeof STOREFRONT_DICTIONARY;

export function t(key: StorefrontDictionaryKey, locale: Locale): string {
  return STOREFRONT_DICTIONARY[key][locale];
}

/** Admin-panel chrome — deliberately a much smaller set (nav + common actions) since staff work in English day-to-day; see the "admin light" scoping decision. */
export const ADMIN_DICTIONARY = {
  dashboard: { en: "Dashboard", hi: "डैशबोर्ड", mr: "डॅशबोर्ड" },
  products: { en: "Products", hi: "उत्पाद", mr: "उत्पादने" },
  categories: { en: "Categories", hi: "श्रेणियाँ", mr: "श्रेणी" },
  collections: { en: "Collections", hi: "कलेक्शन", mr: "कलेक्शन" },
  offers: { en: "Offers", hi: "ऑफर्स", mr: "ऑफर्स" },
  orders: { en: "Orders", hi: "ऑर्डर", mr: "ऑर्डर" },
  reservations: { en: "Reservations", hi: "आरक्षण", mr: "आरक्षणे" },
  enquiries: { en: "Enquiries", hi: "पूछताछ", mr: "चौकशी" },
  analytics: { en: "Analytics", hi: "एनालिटिक्स", mr: "विश्लेषण" },
  media: { en: "Media", hi: "मीडिया", mr: "मीडिया" },
  settings: { en: "Settings", hi: "सेटिंग्स", mr: "सेटिंग्ज" },
  search: { en: "Search", hi: "खोजें", mr: "शोधा" },
  quickCreate: { en: "Quick Create", hi: "त्वरित बनाएं", mr: "जलद तयार करा" },
  profile: { en: "Profile", hi: "प्रोफ़ाइल", mr: "प्रोफाइल" },
  logout: { en: "Log Out", hi: "लॉग आउट", mr: "लॉग आउट" },
  language: { en: "Language", hi: "भाषा", mr: "भाषा" },
} as const satisfies Record<string, LocalizedText>;

export type AdminDictionaryKey = keyof typeof ADMIN_DICTIONARY;

export function adminT(key: AdminDictionaryKey, locale: Locale): string {
  return ADMIN_DICTIONARY[key][locale];
}

/**
 * Sidebar nav group/item labels (`constants/admin-nav.ts`) are plain
 * strings, not LocalizedText — restructuring that whole nav tree (and every
 * consumer: sidebar, command palette, favorites/recents) was out of scope
 * for the "admin light" translation pass, so this is a lookup by the exact
 * English label instead. Falls back to the original string for anything
 * not listed here.
 */
const ADMIN_NAV_LABEL_TRANSLATIONS: Record<string, LocalizedText> = {
  Overview: { en: "Overview", hi: "अवलोकन", mr: "आढावा" },
  Catalogue: { en: "Catalogue", hi: "कैटलॉग", mr: "कॅटलॉग" },
  Sales: { en: "Sales", hi: "बिक्री", mr: "विक्री" },
  "Content (CMS)": { en: "Content (CMS)", hi: "कंटेंट (सीएमएस)", mr: "मजकूर (सीएमएस)" },
  Team: { en: "Team", hi: "टीम", mr: "टीम" },
  Site: { en: "Site", hi: "साइट", mr: "साइट" },
  Settings: { en: "Settings", hi: "सेटिंग्स", mr: "सेटिंग्ज" },
  System: { en: "System", hi: "सिस्टम", mr: "सिस्टम" },
  Dashboard: { en: "Dashboard", hi: "डैशबोर्ड", mr: "डॅशबोर्ड" },
  Analytics: { en: "Analytics", hi: "एनालिटिक्स", mr: "विश्लेषण" },
  Products: { en: "Products", hi: "उत्पाद", mr: "उत्पादने" },
  Collections: { en: "Collections", hi: "कलेक्शन", mr: "कलेक्शन" },
  Categories: { en: "Categories", hi: "श्रेणियाँ", mr: "श्रेणी" },
  Media: { en: "Media", hi: "मीडिया", mr: "मीडिया" },
  Offers: { en: "Offers", hi: "ऑफर्स", mr: "ऑफर्स" },
  Orders: { en: "Orders", hi: "ऑर्डर", mr: "ऑर्डर" },
  Reservations: { en: "Reservations", hi: "आरक्षण", mr: "आरक्षणे" },
  Customers: { en: "Customers", hi: "ग्राहक", mr: "ग्राहक" },
  Enquiries: { en: "Enquiries", hi: "पूछताछ", mr: "चौकशी" },
  "Metal Rates": { en: "Metal Rates", hi: "धातु दरें", mr: "धातू दर" },
  Blogs: { en: "Blogs", hi: "ब्लॉग", mr: "ब्लॉग" },
  Pages: { en: "Pages", hi: "पेज", mr: "पाने" },
  FAQ: { en: "FAQ", hi: "सामान्य प्रश्न", mr: "सामान्य प्रश्न" },
  Gallery: { en: "Gallery", hi: "गैलरी", mr: "गॅलरी" },
  "Styling Stories": {
    en: "Styling Stories",
    hi: "स्टाइलिंग स्टोरीज़",
    mr: "स्टाइलिंग स्टोरीज",
  },
  Testimonials: { en: "Testimonials", hi: "प्रशंसापत्र", mr: "अभिप्राय" },
  Events: { en: "Events", hi: "इवेंट्स", mr: "कार्यक्रम" },
  Staff: { en: "Staff", hi: "स्टाफ", mr: "कर्मचारी" },
  "Roles & Permissions": {
    en: "Roles & Permissions",
    hi: "भूमिकाएँ और अनुमतियाँ",
    mr: "भूमिका आणि परवानग्या",
  },
  "Homepage Builder": {
    en: "Homepage Builder",
    hi: "होमपेज बिल्डर",
    mr: "होमपेज बिल्डर",
  },
  "Hero Slides": { en: "Hero Slides", hi: "हीरो स्लाइड्स", mr: "हिरो स्लाइड्स" },
  "Announcement Bar": {
    en: "Announcement Bar",
    hi: "घोषणा बार",
    mr: "घोषणा बार",
  },
  Appearance: { en: "Appearance", hi: "अपीयरेंस", mr: "स्वरूप" },
  SEO: { en: "SEO", hi: "एसईओ", mr: "एसईओ" },
  "Audit Logs": { en: "Audit Logs", hi: "ऑडिट लॉग", mr: "ऑडिट लॉग" },
  "Recycle Bin": { en: "Recycle Bin", hi: "रीसायकल बिन", mr: "रीसायकल बिन" },
  Backups: { en: "Backups", hi: "बैकअप", mr: "बॅकअप" },
  "Import / Export": {
    en: "Import / Export",
    hi: "इम्पोर्ट / एक्सपोर्ट",
    mr: "इम्पोर्ट / एक्सपोर्ट",
  },
};

export function translateAdminNavLabel(label: string, locale: Locale): string {
  return ADMIN_NAV_LABEL_TRANSLATIONS[label]?.[locale] ?? label;
}
