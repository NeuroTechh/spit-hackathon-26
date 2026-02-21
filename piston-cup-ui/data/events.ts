export const RACE_IMAGE =
  "https://images.squarespace-cdn.com/content/v1/60241cb68df65b530cd84d95/1721072296839-5QU20FNF8QNK7ZK3T2NK/Racing10.jpg?format=2500w";

export interface RaceEvent {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  category: "night-race" | "championship" | "street-circuit" | "special";
  isNight: boolean;
  requiresKyc: boolean;
  minAge: number;
  minReputation: number;
  maxAttendees: number;
  currentAttendees: number;
  status: "upcoming" | "selling-fast" | "sold-out" | "featured";
  description: string;
  requirements: string[];
  highlights: string[];
}

export const events: RaceEvent[] = [
  {
    id: "lightning-mcqueen-gp",
    title: "Lightning McQueen Grand Prix",
    subtitle: "The ultimate showdown at the Motor Speedway of the South",
    date: "March 15, 2026",
    time: "7:00 PM",
    venue: "Motor Speedway of the South",
    location: "Radiator Springs, AZ",
    category: "championship",
    isNight: false,
    requiresKyc: true,
    minAge: 18,
    minReputation: 50,
    maxAttendees: 50000,
    currentAttendees: 34200,
    status: "featured",
    description:
      "Experience the thrill of the Piston Cup's premier event. Watch Lightning McQueen defend his title against the fastest racers in the world. This championship round features a 500-lap endurance race with pit strategy that will keep you on the edge of your seat.",
    requirements: ["Age 18+", "KYC Verified", "Reputation Score 50+"],
    highlights: [
      "500-Lap Championship Race",
      "Pit Lane Access Pass Available",
      "Live Commentary by Bob Cutlass",
      "Post-Race Meet & Greet",
    ],
  },
  {
    id: "doc-hudson-memorial",
    title: "Doc Hudson Memorial Classic",
    subtitle: "Honoring the legacy of the Fabulous Hudson Hornet",
    date: "April 2, 2026",
    time: "3:00 PM",
    venue: "Thomasville Speedway",
    location: "Thomasville, GA",
    category: "special",
    isNight: false,
    requiresKyc: true,
    minAge: 16,
    minReputation: 30,
    maxAttendees: 35000,
    currentAttendees: 28000,
    status: "selling-fast",
    description:
      "A tribute to the legendary Hudson Hornet. This special heritage event brings together classic and modern racers for an unforgettable day of competition and remembrance.",
    requirements: ["Age 16+", "KYC Verified", "Reputation Score 30+"],
    highlights: [
      "Heritage Exhibition Laps",
      "Vintage Car Parade",
      "Documentary Screening",
      "Collector's Edition Pass",
    ],
  },
  {
    id: "radiator-springs-night",
    title: "Radiator Springs Night Race",
    subtitle: "The desert comes alive under the stars",
    date: "March 28, 2026",
    time: "9:00 PM",
    venue: "Ornament Valley Circuit",
    location: "Radiator Springs, AZ",
    category: "night-race",
    isNight: true,
    requiresKyc: true,
    minAge: 18,
    minReputation: 40,
    maxAttendees: 25000,
    currentAttendees: 22100,
    status: "selling-fast",
    description:
      "Race through the neon-lit streets of Radiator Springs as the desert sky transforms into a canvas of stars. One of the most visually stunning events on the Piston Cup calendar.",
    requirements: ["Age 18+", "KYC Verified", "Reputation Score 40+"],
    highlights: [
      "LED-Illuminated Cars",
      "Desert Stargazing Lounge",
      "Neon Pit Lane Experience",
      "Exclusive Night Pass",
    ],
  },
  {
    id: "tokyo-mater-drift",
    title: "Tokyo Drift Invitational",
    subtitle: "Where precision meets power on the streets of Tokyo",
    date: "April 18, 2026",
    time: "8:00 PM",
    venue: "Tokyo Street Circuit",
    location: "Tokyo, Japan",
    category: "street-circuit",
    isNight: true,
    requiresKyc: true,
    minAge: 18,
    minReputation: 60,
    maxAttendees: 30000,
    currentAttendees: 15000,
    status: "upcoming",
    description:
      "The Piston Cup goes international with this exclusive drift-focused street race through downtown Tokyo. Watch the world's best navigate tight corners and narrow streets.",
    requirements: ["Age 18+", "KYC Verified", "Reputation Score 60+"],
    highlights: [
      "Urban Street Circuit",
      "Drift Competition",
      "Japanese Car Culture Expo",
      "VIP Rooftop Viewing",
    ],
  },
  {
    id: "dinoco-400",
    title: "Dinoco 400",
    subtitle: "The crown jewel of the Piston Cup season",
    date: "May 5, 2026",
    time: "4:00 PM",
    venue: "Los Angeles International Speedway",
    location: "Los Angeles, CA",
    category: "championship",
    isNight: false,
    requiresKyc: true,
    minAge: 18,
    minReputation: 70,
    maxAttendees: 80000,
    currentAttendees: 52000,
    status: "upcoming",
    description:
      "The season finale. The Dinoco 400 determines the Piston Cup champion. With the most prestigious sponsorship deal in racing on the line, every driver will give everything they have.",
    requirements: ["Age 18+", "KYC Verified", "Reputation Score 70+"],
    highlights: [
      "Season Championship Finale",
      "Dinoco Sponsorship Ceremony",
      "Celebrity Grid Walk",
      "Championship Trophy Presentation",
    ],
  },
  {
    id: "rusteze-rumble",
    title: "Rust-eze Rumble",
    subtitle: "Underdogs unite at the grassroots racing event",
    date: "March 22, 2026",
    time: "2:00 PM",
    venue: "Rust-eze Racing Center",
    location: "Carburetor County, OK",
    category: "special",
    isNight: false,
    requiresKyc: false,
    minAge: 16,
    minReputation: 10,
    maxAttendees: 15000,
    currentAttendees: 8500,
    status: "upcoming",
    description:
      "Everyone starts somewhere. The Rust-eze Rumble celebrates the spirit of grassroots racing with amateur and semi-pro drivers competing for their shot at the big leagues.",
    requirements: ["Age 16+", "Reputation Score 10+"],
    highlights: [
      "Amateur Racing League",
      "Open Pit Access",
      "Driver Meet & Greet",
      "Rust-eze Product Demos",
    ],
  },
  {
    id: "willy-butte-sprint",
    title: "Willy's Butte Sprint",
    subtitle: "The legendary dirt track where champions train",
    date: "April 10, 2026",
    time: "5:00 PM",
    venue: "Willy's Butte Dirt Track",
    location: "Radiator Springs, AZ",
    category: "street-circuit",
    isNight: false,
    requiresKyc: true,
    minAge: 18,
    minReputation: 35,
    maxAttendees: 10000,
    currentAttendees: 7200,
    status: "selling-fast",
    description:
      "Train like Lightning. The iconic dirt track where McQueen discovered the art of turning right to go left. This sprint race tests raw skill over technology in a stunning desert canyon setting.",
    requirements: ["Age 18+", "KYC Verified", "Reputation Score 35+"],
    highlights: [
      "Dirt Track Racing",
      "Canyon Sunset Views",
      "Training Workshop",
      "Limited Edition Desert Pass",
    ],
  },
  {
    id: "porto-corsa-classic",
    title: "Porto Corsa Grand Circuit",
    subtitle: "European elegance meets American horsepower",
    date: "May 20, 2026",
    time: "6:00 PM",
    venue: "Porto Corsa Riviera Circuit",
    location: "Porto Corsa, Italy",
    category: "championship",
    isNight: false,
    requiresKyc: true,
    minAge: 18,
    minReputation: 80,
    maxAttendees: 45000,
    currentAttendees: 20000,
    status: "upcoming",
    description:
      "The Piston Cup heads to the Italian Riviera for this prestigious international round. Winding coastal roads, Mediterranean atmosphere, and world-class racing combine for an event that defines luxury motorsport.",
    requirements: ["Age 18+", "KYC Verified", "Reputation Score 80+"],
    highlights: [
      "Coastal Riviera Circuit",
      "Mediterranean Hospitality",
      "International Field",
      "Luxury VIP Suites",
    ],
  },
];

export const categories = [
  {
    id: "night-race",
    name: "Night Races",
    description: "Under-the-stars racing with illuminated tracks",
    count: events.filter((e) => e.category === "night-race").length,
  },
  {
    id: "championship",
    name: "Championship Rounds",
    description: "Official Piston Cup championship events",
    count: events.filter((e) => e.category === "championship").length,
  },
  {
    id: "street-circuit",
    name: "Street Circuits",
    description: "Urban and natural terrain racing",
    count: events.filter((e) => e.category === "street-circuit").length,
  },
  {
    id: "special",
    name: "Special Events",
    description: "Heritage, exhibition, and community races",
    count: events.filter((e) => e.category === "special").length,
  },
];
