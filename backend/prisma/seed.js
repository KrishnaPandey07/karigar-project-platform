const { PrismaClient, Role, VerificationStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting LocalLink Database Seeding (India Edition)...');

  // Clean existing data in reverse relation order
  await prisma.review.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.requestStatusHistory.deleteMany();
  await prisma.report.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.verificationDocument.deleteMany();
  await prisma.vendorVerification.deleteMany();
  await prisma.vendorService.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.adminAuditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.emailVerification.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);

  // 1. Seed Administrators
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@locallink.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
      isVerified: true,
    },
  });

  const customAdminPasswordHash = await bcrypt.hash('Krishna,0007', 10);
  await prisma.user.create({
    data: {
      email: 'lgtvk84@gmail.com',
      passwordHash: customAdminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
      isVerified: true,
    },
  });
  console.log('✅ Admin users created: admin@locallink.com, lgtvk84@gmail.com');

  // 2. Seed Demo Customers with Indian Addresses and Phones
  const customerUser1 = await prisma.user.create({
    data: {
      email: 'customer@locallink.com',
      passwordHash: passwordHash,
      role: Role.CUSTOMER,
      isActive: true,
      isVerified: true,
      customerProfile: {
        create: {
          fullName: 'Aarav Sharma',
          phone: '+91-98101-23456',
          address: 'B-42, Connaught Place, New Delhi',
          defaultLat: 28.6304,
          defaultLng: 77.2177,
        },
      },
    },
    include: { customerProfile: true },
  });

  const customerUser2 = await prisma.user.create({
    data: {
      email: 'bob.customer@locallink.com',
      passwordHash: passwordHash,
      role: Role.CUSTOMER,
      isActive: true,
      isVerified: true,
      customerProfile: {
        create: {
          fullName: 'Pooja Patel',
          phone: '+91-98202-34567',
          address: 'Flat 301, Silver Sands, Bandra West, Mumbai',
          defaultLat: 19.0596,
          defaultLng: 72.8295,
        },
      },
    },
  });
  console.log('✅ Demo customers created (Aarav Sharma - Delhi, Pooja Patel - Mumbai)');

  // 3. Seed Categories & Services (INR Rates ₹150 - ₹3500)
  const categoriesData = [
    {
      name: 'Electrical & Wiring',
      slug: 'electrical-wiring',
      icon: 'zap',
      description: 'Certified electrical repairs, fan installation, switchboards, and inverters.',
      services: [
        { name: 'Ceiling Fan Installation & Repair', slug: 'ceiling-fan-installation', min: 200, max: 500 },
        { name: 'Switchboard & MCB Repair', slug: 'switchboard-mcb-repair', min: 350, max: 1200 },
        { name: 'Full House Wiring & Earthing Check', slug: 'full-house-wiring-check', min: 800, max: 2500 },
      ],
    },
    {
      name: 'Tailoring & Alterations',
      slug: 'tailoring-alterations',
      icon: 'scissors',
      description: 'Custom bespoke stitching, kurti/blouse designing, and formal suit alterations.',
      services: [
        { name: 'Kurti & Blouse Custom Stitching', slug: 'kurti-blouse-stitching', min: 300, max: 950 },
        { name: 'Suit & Sherwani Alteration', slug: 'suit-sherwani-alteration', min: 450, max: 1500 },
        { name: 'Curtains & Upholstery Fitting', slug: 'curtains-upholstery-fitting', min: 250, max: 800 },
      ],
    },
    {
      name: 'Tutoring & Academics',
      slug: 'tutoring-academics',
      icon: 'book-open',
      description: 'One-on-one personal coaching in CBSE/ICSE, IIT-JEE, and languages.',
      services: [
        { name: 'CBSE & ICSE Class 10/12 Maths', slug: 'cbse-icse-maths-tutoring', min: 400, max: 1000 },
        { name: 'IIT-JEE & NEET Physics Prep', slug: 'iit-jee-neet-physics-prep', min: 600, max: 1500 },
        { name: 'Spoken English & Communication Coaching', slug: 'spoken-english-coaching', min: 300, max: 800 },
      ],
    },
    {
      name: 'Plumbing & Pipefitting',
      slug: 'plumbing-pipefitting',
      icon: 'wrench',
      description: 'Leak repair, tap replacement, RO water purifier service, and drainage unclogging.',
      services: [
        { name: 'Tap Leakage & Pipeline Fix', slug: 'tap-leakage-pipeline-fix', min: 250, max: 650 },
        { name: 'Water Motor & RO Purifier Servicing', slug: 'water-motor-ro-servicing', min: 400, max: 1200 },
        { name: 'Geyser & Bathroom Fitting Setup', slug: 'geyser-bathroom-setup', min: 500, max: 1400 },
      ],
    },
    {
      name: 'Housekeeping & Cleaning',
      slug: 'housekeeping-cleaning',
      icon: 'sparkles',
      description: 'Deep home cleaning, sofa steam shampooing, and kitchen sanitization.',
      services: [
        { name: 'Deep Home Cleaning (2 BHK / 3 BHK)', slug: 'deep-home-cleaning-2bhk', min: 1499, max: 3499 },
        { name: 'Sofa & Carpet Shampoo Cleaning', slug: 'sofa-carpet-shampoo-cleaning', min: 699, max: 1899 },
      ],
    },
    {
      name: 'AC & Appliance Repair',
      slug: 'ac-appliance-repair',
      icon: 'tool',
      description: 'Split & window AC servicing, gas charging, washing machine, and fridge repair.',
      services: [
        { name: 'Split / Window AC Jet Servicing', slug: 'ac-jet-servicing', min: 499, max: 1299 },
        { name: 'Refrigerator & Washing Machine Repair', slug: 'fridge-washing-machine-repair', min: 399, max: 1500 },
      ],
    },
    {
      name: 'Gardener & Landscaping',
      slug: 'gardener-landscaping',
      icon: 'flower',
      description: 'Lawn mowing, hedge trimming, terrace garden potting, organic manure, and plant health care.',
      services: [
        { name: 'Lawn Mowing & Hedge Trimming', slug: 'lawn-mowing-trimming', min: 250, max: 650 },
        { name: 'Terrace Garden Potting & Plant Care', slug: 'terrace-potting-care', min: 400, max: 1200 },
      ],
    },
    {
      name: 'Maid, Cook & Domestic Help',
      slug: 'maid-cook-househelp',
      icon: 'heart',
      description: 'Daily home meal preparation, brooming, mopping, utensil cleaning, and domestic assistance.',
      services: [
        { name: 'Daily Home Cook (Fresh Meal Preparation)', slug: 'daily-home-cook', min: 300, max: 700 },
        { name: 'Housemaid (Brooming, Mopping & Dusting)', slug: 'housemaid-daily-help', min: 250, max: 550 },
      ],
    },
    {
      name: 'Halwai & Traditional Catering',
      slug: 'halwai-catering',
      icon: 'coffee',
      description: 'Traditional wedding sweets, pooja prasad, festival delicacies, and celebratory party feast cooking.',
      services: [
        { name: 'Fresh Sweets & Namkeen (Ladoo, Jalebi, Gulab Jamun)', slug: 'fresh-sweets-namkeen', min: 600, max: 2500 },
        { name: 'Pooja, Hawan & Celebration Feast Cooking', slug: 'celebration-feast-cooking', min: 1500, max: 5000 },
      ],
    },
    {
      name: 'Carpenter & Woodwork',
      slug: 'carpenter-woodwork',
      icon: 'wrench',
      description: 'Door lock fitting, window repair, modular kitchen carpentry, and furniture repair.',
      services: [
        { name: 'Door & Window Lock Repair / Fitting', slug: 'door-lock-fitting', min: 200, max: 600 },
        { name: 'Custom Wood Furniture & Bed Repair', slug: 'wood-furniture-repair', min: 350, max: 1200 },
      ],
    },
    {
      name: 'Painter & Putty Work',
      slug: 'painter-whitewash',
      icon: 'paint-brush',
      description: 'Interior room painting, putty smoothing, waterproofing, and exterior whitewashing.',
      services: [
        { name: 'Room Wall Painting & Putty Touch-up', slug: 'wall-painting-putty', min: 600, max: 2000 },
        { name: 'Waterproof Coating & Damp Fix', slug: 'waterproof-damp-fix', min: 1000, max: 3500 },
      ],
    },
    {
      name: 'Personal & Commercial Driver',
      slug: 'driver-transport',
      icon: 'navigation',
      description: 'Verified hourly/daily city car driver, highway outstation driving, and urgent trip driving.',
      services: [
        { name: 'City Day Car Driver (Hourly / 8 Hours)', slug: 'city-car-driver', min: 450, max: 1100 },
        { name: 'Outstation Highway Driving Trip', slug: 'outstation-driver', min: 1200, max: 2200 },
      ],
    },
    {
      name: 'Pandit Ji & Religious Ceremonies',
      slug: 'pandit-purohit',
      icon: 'sun',
      description: 'Griha Pravesh, Satyanarayan Katha, Vastu Pooja, and traditional auspicious rituals.',
      services: [
        { name: 'Griha Pravesh & Vastu Shanti Pooja', slug: 'griha-pravesh-pooja', min: 1100, max: 3100 },
        { name: 'Satyanarayan Katha & Hawan', slug: 'satyanarayan-katha-hawan', min: 800, max: 2100 },
      ],
    },
  ];

  const createdCategories = [];
  const createdServices = [];

  for (const cat of categoriesData) {
    const category = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
      },
    });
    createdCategories.push(category);

    for (const s of cat.services) {
      const service = await prisma.service.create({
        data: {
          categoryId: category.id,
          name: s.name,
          slug: s.slug,
          description: `Professional ${s.name.toLowerCase()} service with satisfaction guarantee.`,
          basePriceMin: s.min,
          basePriceMax: s.max,
        },
      });
      createdServices.push(service);
    }
  }
  console.log(`✅ Seeded ${createdCategories.length} categories and ${createdServices.length} services`);

  // 4. Seed 10 Solo Indian Artisans across Major States & Cities (Individual Craftspeople, No Companies)
  const vendorsData = [
    {
      email: 'vendor@locallink.com',
      businessName: 'Ramesh Sharma (Electrician)',
      bio: 'Independent electrician with 15+ years experience in domestic wiring, ceiling fans, MCB boxes, and inverter setup. Honest rates, prompt service.',
      phone: '+91-98111-22334',
      address: 'Shop 14, Main Market, Connaught Place, New Delhi',
      city: 'Delhi',
      postalCode: '110001',
      lat: 28.6315,
      lng: 77.2167,
      radiusKm: 20,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 15,
      ratingAvg: 4.9,
      ratingCount: 48,
      categorySlug: 'electrical-wiring',
      priceFactor: 1.0,
      docType: 'AADHAAR_CARD:9823-4512-7801',
    },
    {
      email: 'vendor.needle@locallink.com',
      businessName: 'Mohd. Arif (Master Tailor)',
      bio: 'Independent master tailor specializing in kurta-pajama, pant-shirt stitching, blouses, alterations, and custom garment fitting.',
      phone: '+91-98222-33445',
      address: 'Hill Road, Bandra West, Mumbai',
      city: 'Mumbai',
      postalCode: '400050',
      lat: 19.0558,
      lng: 72.8315,
      radiusKm: 15,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 25,
      ratingAvg: 4.8,
      ratingCount: 32,
      categorySlug: 'tailoring-alterations',
      priceFactor: 1.0,
      docType: 'PAN_CARD:ABCDE1234F',
    },
    {
      email: 'vendor.tutor@locallink.com',
      businessName: 'Rajesh Vishwakarma (Carpenter)',
      bio: 'Skilled solo carpenter for wooden door-window repair, furniture assembly, lock replacement, and general home carpentry work.',
      phone: '+91-98333-44556',
      address: 'Koramangala, Bengaluru',
      city: 'Bengaluru',
      postalCode: '560034',
      lat: 12.9352,
      lng: 77.6245,
      radiusKm: 18,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 10,
      ratingAvg: 5.0,
      ratingCount: 65,
      categorySlug: 'tutoring-academics',
      priceFactor: 1.1,
      docType: 'AADHAAR_CARD:7812-3490-5621',
    },
    {
      email: 'vendor.plumb@locallink.com',
      businessName: 'Suresh Prajapati (Plumber)',
      bio: 'Solo plumber with 12 years experience in tap repairs, bathroom sanitary fittings, water motor setup, and leak resolution.',
      phone: '+91-98444-55667',
      address: 'Hitec City, Hyderabad',
      city: 'Hyderabad',
      postalCode: '500081',
      lat: 17.4474,
      lng: 78.3762,
      radiusKm: 20,
      isVerified: true,
      isAvailable: false, // currently busy
      responseTimeAvg: 45,
      ratingAvg: 4.6,
      ratingCount: 22,
      categorySlug: 'plumbing-pipefitting',
      priceFactor: 0.95,
      docType: 'AADHAAR_CARD:4590-1289-3321',
    },
    {
      email: 'vendor.clean@locallink.com',
      businessName: 'Sunita Devi (Home Care)',
      bio: 'Reliable and punctual independent house cleaner. Specialist in kitchen deep cleaning, sofa shampooing, and domestic care.',
      phone: '+91-98555-66778',
      address: 'T. Nagar, Chennai',
      city: 'Chennai',
      postalCode: '600017',
      lat: 13.0418,
      lng: 80.2341,
      radiusKm: 15,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 20,
      ratingAvg: 4.7,
      ratingCount: 40,
      categorySlug: 'housekeeping-cleaning',
      priceFactor: 1.0,
      docType: 'VOTER_ID:TN140928341',
    },
    {
      email: 'vendor.voltage@locallink.com',
      businessName: 'Manoj Kumar (Electrician)',
      bio: 'Solo residential electrician for quick wiring fixes, switch replacements, lighting setups, and emergency callouts.',
      phone: '+91-98666-77889',
      address: 'Salt Lake City, Sector 1, Kolkata',
      city: 'Kolkata',
      postalCode: '700091',
      lat: 22.5867,
      lng: 88.4178,
      radiusKm: 15,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 60,
      ratingAvg: 4.2,
      ratingCount: 9,
      categorySlug: 'electrical-wiring',
      priceFactor: 0.85,
      docType: 'AADHAAR_CARD:5612-8901-2345',
    },
    {
      email: 'vendor.bespoke@locallink.com',
      businessName: 'Sarita Verma (Tailor & Boutique)',
      bio: 'Experienced solo artisan for ladies suit tailoring, blouse designs, dress alterations, and fine needlework.',
      phone: '+91-98777-88990',
      address: 'Kothrud, Pune',
      city: 'Pune',
      postalCode: '411038',
      lat: 18.5074,
      lng: 73.8077,
      radiusKm: 15,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 30,
      ratingAvg: 4.9,
      ratingCount: 51,
      categorySlug: 'tailoring-alterations',
      priceFactor: 1.05,
      docType: 'PAN_CARD:PUNTR9876K',
    },
    {
      email: 'vendor.math@locallink.com',
      businessName: 'Anil Yadav (AC & Appliance Tech)',
      bio: 'Solo technician for split/window AC servicing, gas refills, refrigerator repairs, and washing machine maintenance.',
      phone: '+91-98888-99001',
      address: 'Navrangpura, Ahmedabad',
      city: 'Ahmedabad',
      postalCode: '380009',
      lat: 23.0365,
      lng: 72.5458,
      radiusKm: 15,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 12,
      ratingAvg: 4.85,
      ratingCount: 38,
      categorySlug: 'ac-appliance-repair',
      priceFactor: 1.15,
      docType: 'AADHAAR_CARD:8812-4411-9012',
    },
    {
      email: 'vendor.pipes@locallink.com',
      businessName: 'Vikram Singh (Plumber)',
      bio: 'Over 10 years experience in water tank cleaning, pipe repairs, bathroom fitting replacements, and drain clearing.',
      phone: '+91-98999-00112',
      address: 'Malviya Nagar, Jaipur',
      city: 'Jaipur',
      postalCode: '302017',
      lat: 26.8524,
      lng: 75.8197,
      radiusKm: 15,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 18,
      ratingAvg: 4.5,
      ratingCount: 19,
      categorySlug: 'plumbing-pipefitting',
      priceFactor: 1.0,
      docType: 'AADHAAR_CARD:3401-7892-1204',
    },
    {
      email: 'vendor.shine@locallink.com',
      businessName: 'Dinesh Saini (Painter & Putty)',
      bio: 'Hardworking solo painter for room putty work, interior-exterior painting, texture walls, and touchup painting.',
      phone: '+91-98000-11223',
      address: 'Gomti Nagar, Lucknow',
      city: 'Lucknow',
      postalCode: '226010',
      lat: 26.8500,
      lng: 80.9925,
      radiusKm: 15,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 40,
      ratingAvg: 4.6,
      ratingCount: 14,
      categorySlug: 'housekeeping-cleaning',
      priceFactor: 0.9,
      docType: 'AADHAAR_CARD:9012-3456-7890',
    },
    {
      email: 'vendor.mali@locallink.com',
      businessName: 'Ramphal Saini (Gardener & Mali)',
      bio: 'Independent gardener for lawn mowing, garden hedging, potting, balcony plants, and organic fertilization.',
      phone: '+91-98101-22334',
      address: 'Rohini Sector 9, New Delhi',
      city: 'Delhi',
      postalCode: '110085',
      lat: 28.7144,
      lng: 77.1166,
      radiusKm: 18,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 20,
      ratingAvg: 4.85,
      ratingCount: 36,
      categorySlug: 'gardener-landscaping',
      priceFactor: 0.95,
      docType: 'AADHAAR_CARD:9812-7634-1102',
    },
    {
      email: 'vendor.maid@locallink.com',
      businessName: 'Laxmi Bai (Cook & Domestic Maid)',
      bio: 'Punctual and trusted home cook and maid. Expert in fresh home meals, brooming, mopping, and kitchen hygiene.',
      phone: '+91-98202-33445',
      address: 'Shivajinagar, Pune',
      city: 'Pune',
      postalCode: '411005',
      lat: 18.5314,
      lng: 73.8446,
      radiusKm: 15,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 15,
      ratingAvg: 4.9,
      ratingCount: 52,
      categorySlug: 'maid-cook-househelp',
      priceFactor: 1.0,
      docType: 'AADHAAR_CARD:8723-1109-4456',
    },
    {
      email: 'vendor.halwai@locallink.com',
      businessName: 'Radhey Shyam Halwai (Master Sweetmaker & Feast Cook)',
      bio: 'Traditional halwai with 20+ years expertise in fresh sweets (Gulab Jamun, Jalebi, Ladoo), pooja prasad, and celebratory feasts.',
      phone: '+91-98303-44556',
      address: 'Johari Bazar, Jaipur',
      city: 'Jaipur',
      postalCode: '302003',
      lat: 26.9196,
      lng: 75.8282,
      radiusKm: 25,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 25,
      ratingAvg: 4.95,
      ratingCount: 78,
      categorySlug: 'halwai-catering',
      priceFactor: 1.05,
      docType: 'PAN_CARD:BHYPR8712K',
    },
    {
      email: 'vendor.driver@locallink.com',
      businessName: 'Mukesh Yadav (Personal Car Driver)',
      bio: 'Safe and courteous personal driver with 12 years accident-free driving in manual and automatic cars across city and highways.',
      phone: '+91-98505-66778',
      address: 'Sector 62, Noida, NCR',
      city: 'Delhi',
      postalCode: '201309',
      lat: 28.6280,
      lng: 77.3649,
      radiusKm: 30,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 10,
      ratingAvg: 4.8,
      ratingCount: 44,
      categorySlug: 'driver-transport',
      priceFactor: 1.0,
      docType: 'DRIVING_LICENSE:DL-0420180091234',
    },
    {
      email: 'vendor.pandit@locallink.com',
      businessName: 'Pt. Vidyadhar Shastri (Purohit & Pooja)',
      bio: 'Vedic scholar and purohit for Griha Pravesh, Satyanarayan Bhagwan Katha, Vastu Shanti, Navgraha Pooja, and auspicious rituals.',
      phone: '+91-98606-77889',
      address: 'Laxmi Nagar, East Delhi',
      city: 'Delhi',
      postalCode: '110092',
      lat: 28.6310,
      lng: 77.2770,
      radiusKm: 25,
      isVerified: true,
      isAvailable: true,
      responseTimeAvg: 30,
      ratingAvg: 5.0,
      ratingCount: 61,
      categorySlug: 'pandit-purohit',
      priceFactor: 1.0,
      docType: 'AADHAAR_CARD:4310-9988-1123',
    },
  ];

  for (const v of vendorsData) {
    const user = await prisma.user.create({
      data: {
        email: v.email,
        passwordHash: passwordHash,
        role: Role.VENDOR,
        isActive: true,
        isVerified: true,
        vendorProfile: {
          create: {
            businessName: v.businessName,
            bio: v.bio,
            phone: v.phone,
            address: v.address,
            lat: v.lat,
            lng: v.lng,
            isVerified: v.isVerified,
            isAvailable: v.isAvailable,
            responseTimeAvg: v.responseTimeAvg,
            ratingAvg: v.ratingAvg,
            ratingCount: v.ratingCount,
          },
        },
      },
      include: { vendorProfile: true },
    });

    const vendorProfileId = user.vendorProfile.id;

    // Add service areas for vendor's Indian city and PIN code
    await prisma.serviceArea.create({
      data: {
        vendorId: vendorProfileId,
        city: v.city,
        postalCode: v.postalCode,
        radiusKm: v.radiusKm,
      },
    });

    // Attach services for this category
    const cat = createdCategories.find((c) => c.slug === v.categorySlug);
    if (cat) {
      const servicesForCat = createdServices.filter((s) => s.categoryId === cat.id);

      for (const serv of servicesForCat) {
        await prisma.vendorService.create({
          data: {
            vendorId: vendorProfileId,
            serviceId: serv.id,
            priceMin: Math.round(Number(serv.basePriceMin) * v.priceFactor),
            priceMax: Math.round(Number(serv.basePriceMax) * v.priceFactor),
            description: `Customized ${serv.name} provided by ${v.businessName}.`,
            isAvailable: true,
          },
        });
      }
    }

    // Add verification record with Aadhaar, PAN, Voter ID, or Trade License
    await prisma.vendorVerification.create({
      data: {
        vendorId: vendorProfileId,
        status: v.isVerified ? VerificationStatus.APPROVED : VerificationStatus.PENDING,
        reviewedBy: v.isVerified ? adminUser.id : null,
        reviewedAt: v.isVerified ? new Date() : null,
        documents: {
          create: [
            {
              documentType: v.docType,
              documentUrl: 'https://example.com/docs/verified-document.pdf',
              isPrivate: true,
            },
          ],
        },
      },
    });
  }

  console.log(`✅ Seeded ${vendorsData.length} detailed Indian vendor profiles across Delhi, Mumbai, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, Jaipur, Lucknow`);
  console.log('🎉 Seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
