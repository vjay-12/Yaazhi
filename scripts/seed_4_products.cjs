const http = require('http');

const productsToCreate = [
  {
    sku: 'YZ-CHU-006',
    name: 'Royal Maroon Embroidered Churidar Set',
    description: '3-piece luxury churidar salwar suit in rich royal maroon art silk blend, featuring intricate gold zardozi and resham thread embroidery on the neckline, paired with a matching churidar and embroidered dupatta.',
    fabric: 'Art Silk / Silk Blend',
    craft: 'Zardozi & Resham Embroidery',
    category: 'Churidars & Salwars',
    unit: 'SET',
    sale_price: 6900,
    purchase_price: 3800,
    hsn_code: '6204',
    tax_rate: 12.0,
    min_stock_level: 4,
    initial_stock: 18,
    image_url: '/images/products/maroon-churidar-set.jpg',
  },
  {
    sku: 'YZ-ANK-007',
    name: 'Emerald Green Anarkali Churidar Set',
    description: 'Regal emerald green floor-length flowy georgette anarkali suit embellished with exquisite gold gota patti and foil mirror borders, paired with fitted churidar pants and a bordered net dupatta.',
    fabric: 'Georgette',
    craft: 'Gota Patti & Foil Mirror Work',
    category: 'Churidars & Salwars',
    unit: 'SET',
    sale_price: 7500,
    purchase_price: 4200,
    hsn_code: '6204',
    tax_rate: 12.0,
    min_stock_level: 3,
    initial_stock: 12,
    image_url: '/images/products/emerald-anarkali-set.jpg',
  },
  {
    sku: 'YZ-KID-008',
    name: 'Kids Festive Pink Kurta Palazzo Set',
    description: 'Charming festive pink girls kurta palazzo set crafted in soft breathable cotton silk with delicate sequin floral yoke embroidery, paired with relaxed wide-leg palazzos and lightweight dupatta.',
    fabric: 'Cotton Silk',
    craft: 'Sequin & Floral Zari Yoke',
    category: 'Kids Ethnic',
    unit: 'SET',
    sale_price: 2950,
    purchase_price: 1650,
    hsn_code: '6204',
    tax_rate: 5.0,
    min_stock_level: 4,
    initial_stock: 15,
    image_url: '/images/products/kids-pink-palazzo.jpg',
  },
  {
    sku: 'YZ-KID-009',
    name: 'Kids Royal Blue Kurta Pyjama Set',
    description: 'Dapper royal blue boys festive ethnic set featuring a tailored cotton silk kurta with an embroidered mandarin Nehru collar, gold potli buttons, and front placket detailing, complete with comfortable ivory churidar pyjamas.',
    fabric: 'Cotton Silk',
    craft: 'Nehru Collar Woven Brocade',
    category: 'Kids Ethnic',
    unit: 'SET',
    sale_price: 2600,
    purchase_price: 1450,
    hsn_code: '6203',
    tax_rate: 5.0,
    min_stock_level: 5,
    initial_stock: 20,
    image_url: '/images/products/kids-blue-kurta.jpg',
  },
];

async function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const u = new URL(url);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('--- Seeding 4 New Realistic Boutique Products into Yaazhi Catalog ---');

  for (const item of productsToCreate) {
    const res = await postJson('http://localhost:3002/api/products', item);
    if (res.status === 201) {
      console.log(`✓ Created: ${item.sku} - ${item.name} (${item.category}) | Stock: ${item.initial_stock}`);
    } else {
      console.log(`! Response for ${item.sku} (Status ${res.status}):`, res.data || res.body);
    }
  }

  // Verify
  console.log('\n--- Verifying All Products from API ---');
  http.get('http://localhost:3002/api/products?status=all', (res) => {
    let raw = '';
    res.on('data', (c) => (raw += c));
    res.on('end', () => {
      const all = JSON.parse(raw);
      console.log(`Total Products in Catalog: ${all.length}`);
      all.forEach((p) => {
        console.log(`• ${p.sku} | ${p.name} | ${p.category} | Stock: ${p.currentStock} | Price: ₹${p.salePrice} | Img: ${p.imageUrl}`);
      });
    });
  });
}

main().catch(console.error);
