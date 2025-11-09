// Random data generation utility for SOFIA real estate templates

const cyprusLocations = [
  "Paphos",
  "Limassol",
  "Nicosia",
  "Larnaca",
  "Ayia Napa",
  "Paralimni",
  "Tala",
  "Coral Bay",
  "Peyia",
  "Kato Paphos",
  "Universal",
  "Emba",
  "Chloraka",
  "Geroskipou",
  "Yeroskipou",
  "Kissonerga",
  "Latchi",
  "Polis",
  "Argaka",
];

const cyprusPropertyTypes = [
  "Villa",
  "Apartment",
  "Penthouse",
  "Townhouse",
  "Bungalow",
  "Detached House",
  "Semi-detached House",
  "Studio",
  "Maisonette",
  "Luxury Villa",
  "Beachfront Villa",
];

const commonCypriotNames = [
  "Andreas & Elena",
  "George & Maria",
  "Nicos & Anna",
  "Costas & Sophia",
  "Michalis & Eleni",
  "Panayiotis & Despina",
  "Christos & Georgia",
  "Marios & Christina",
  "Stavros & Katerina",
  "Dimitris & Paraskevi",
  "Savvas & Androula",
  "Yiannis & Maro",
];

const cypriotSurnames = [
  "Papadopoulos",
  "Christoforou",
  "Andreiou",
  "Georgiou",
  "Constantinou",
  "Nicolau",
  "Michaelides",
  "Charalambous",
  "Ioannou",
  "Petrides",
  "Antoniou",
  "Stephanou",
  "Pavlou",
  "Kyriacou",
  "Neophytou",
];

const propertyFeatures = [
  "Private pool",
  "Sea views",
  "Mountain views",
  "Garden",
  "Parking space",
  "Air conditioning",
  "Central heating",
  "Fireplace",
  "Storage room",
  "Guest toilet",
  "Ensuite bathroom",
  "Walk-in wardrobe",
  "Balcony",
  "Terrace",
  "BBQ area",
  "Solar water heating",
  "Double glazing",
  "Alarm system",
  "Satellite TV",
  "High-speed internet",
];

export function generateRandomSellerData() {
  const sellerName =
    commonCypriotNames[Math.floor(Math.random() * commonCypriotNames.length)];
  const surname =
    cypriotSurnames[Math.floor(Math.random() * cypriotSurnames.length)];
  const registrationNumber = `0/${Math.floor(Math.random() * 9999) + 1}`;
  const location =
    cyprusLocations[Math.floor(Math.random() * cyprusLocations.length)];
  const propertyType =
    cyprusPropertyTypes[Math.floor(Math.random() * cyprusPropertyTypes.length)];

  // Generate random dates within next 30 days
  const viewingDate = new Date();
  viewingDate.setDate(
    viewingDate.getDate() + Math.floor(Math.random() * 30) + 1
  );
  const formattedDate = viewingDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Generate random time
  const hours = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
  const minutes = Math.random() > 0.5 ? "00" : "30";
  const formattedTime = `${hours}:${minutes} ${hours >= 12 ? "PM" : "AM"}`;

  // Generate random property ID
  const propertyId = Math.floor(Math.random() * 99_999) + 10_000;

  return {
    sellerName: `${sellerName} ${surname}`,
    registrationNumber,
    propertyType,
    location,
    fullLocation: `${propertyType} in ${location}`,
    propertyLink: `https://www.zyprus.com/Cyprus/property/${propertyId}`,
    viewingDate: formattedDate,
    viewingTime: formattedTime,
    propertyId,
  };
}

export function generateRandomMarketingData() {
  const baseData = generateRandomSellerData();

  // Add more details for marketing agreement
  const bedrooms = Math.floor(Math.random() * 4) + 2; // 2-5 bedrooms
  const bathrooms = Math.floor(Math.random() * 3) + 1; // 1-3 bathrooms
  const poolSize = Math.random() > 0.5 ? "private pool" : "communal pool";
  const selectedFeatures: string[] = [];

  // Randomly select 3-7 features
  const numFeatures = Math.floor(Math.random() * 5) + 3;
  const shuffled = [...propertyFeatures].sort(() => 0.5 - Math.random());
  selectedFeatures.push(...shuffled.slice(0, numFeatures));

  return {
    ...baseData,
    bedrooms,
    bathrooms,
    features: selectedFeatures.join(", "),
    poolSize,
    detailedDescription: `${baseData.propertyType}, ${bedrooms} bedrooms, ${bathrooms} bathrooms, ${poolSize}, ${selectedFeatures.slice(0, 3).join(", ").toLowerCase()}`,
  };
}

export function generateRandomViewingData() {
  const baseData = generateRandomSellerData();

  // Add client information for viewing forms
  const clientNames = commonCypriotNames.filter(
    (name) => name !== baseData.sellerName.split(" ")[0]
  );
  const clientName =
    clientNames[Math.floor(Math.random() * clientNames.length)];
  const clientSurname =
    cypriotSurnames[Math.floor(Math.random() * cypriotSurnames.length)];
  const clientPhone = `99${Math.floor(Math.random() * 900_000) + 100_000}`;
  const clientEmail = `${clientName.toLowerCase().replace(" & ", ".")}.${clientSurname.toLowerCase()}@example.com`;

  return {
    ...baseData,
    clientName: `${clientName} ${clientSurname}`,
    clientPhone,
    clientEmail,
    agentName: "SOFIA AI Assistant",
    agencyName: "CSC Zyprus Property Group LTD",
  };
}

type TemplateDataset =
  | ReturnType<typeof generateRandomSellerData>
  | ReturnType<typeof generateRandomMarketingData>
  | ReturnType<typeof generateRandomViewingData>;

export function getRandomTemplatePrompt(
  templateType: "registration" | "marketing" | "viewing" = "registration"
) {
  let data: TemplateDataset;
  let templateName: string;

  switch (templateType) {
    case "marketing":
      data = generateRandomMarketingData();
      templateName = "Marketing Agreement";
      break;
    case "viewing":
      data = generateRandomViewingData();
      templateName = "Viewing Form";
      break;
    default:
      data = generateRandomSellerData();
      templateName = "Standard Seller Registration";
  }

  let additionalInfo = "";

  if ("bedrooms" in data) {
    const marketingData = data as ReturnType<
      typeof generateRandomMarketingData
    >;
    additionalInfo += `
Bedrooms: ${marketingData.bedrooms}
Bathrooms: ${marketingData.bathrooms}
Features: ${marketingData.features || marketingData.detailedDescription}`;
  }

  if ("clientName" in data) {
    const viewingData = data as ReturnType<typeof generateRandomViewingData>;
    additionalInfo += `
Client: ${viewingData.clientName}
Client Phone: ${viewingData.clientPhone}
Client Email: ${viewingData.clientEmail}`;
  }

  return `Standard ${templateName} (write it to me with random prefilled information)

Seller: ${data.sellerName}
Registration No: ${data.registrationNumber}
Property: ${data.fullLocation}
Property Link: ${data.propertyLink}
Viewing: ${data.viewingDate} at ${data.viewingTime}${additionalInfo}`;
}
