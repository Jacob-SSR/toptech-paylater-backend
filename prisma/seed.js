const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const iconv = require("iconv-lite");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function normalizeKey(key) {
  return key
    .toString()
    .replace(/\s+/g, "")
    .replace(/[()]/g, "")
    .toLowerCase()
    .trim();
}

function safeDecode(buffer) {
  let text = iconv.decode(buffer, "utf-8");
  if (text.includes("�")) {
    text = iconv.decode(buffer, "tis-620");
  }
  return text;
}

async function seedFromFile(filePath) {
  const fileName = path.basename(filePath);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${fileName}`);
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const csvData = safeDecode(fileBuffer);

  const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
  if (!parsed.data.length) {
    console.error(`⚠️ No data parsed from: ${fileName}`);
    return;
  }

  let condition = "NEW";
  if (/มือ\s*2/i.test(fileName)) {
    condition = "USED";
  }

  console.log(`\n🚀 Seeding: ${fileName} (Condition: ${condition})`);
  console.log(
    "📌 Headers:",
    Object.keys(parsed.data[0]).map((k) => normalizeKey(k))
  );

  for (const row of parsed.data) {
    try {
      const normalized = Object.fromEntries(
        Object.entries(row).map(([k, v]) => [normalizeKey(k), v])
      );

      const sku = (normalized["sku"] || "").trim();
      if (!sku) {
        console.warn("⚠️ Missing SKU, skipping row.");
        continue;
      }

      const priceCash =
        parseFloat(
          (
            normalized["ราคาสด"] ||
            normalized["ราคาสดต้นทุนจริง*ดอกเบี้ย"] ||
            "0"
          )
            .toString()
            .replace(/,/g, "")
        ) || 0;

      const product = await prisma.product.upsert({
        where: { sku },
        update: {
          category: (normalized["หมวดหมู่"] || "").trim(),
          brand: (normalized["ยี่ห้อ"] || "").trim(),
          model: (normalized["รุ่น"] || "").trim(),
          storage: (normalized["ความจุ"] || "").trim(),
          color: (normalized["สี"] || "").trim(),
          name: `${normalized["ยี่ห้อ"] || ""} ${normalized["รุ่น"] || ""} ${
            normalized["ความจุ"] || ""
          } ${normalized["สี"] || ""}`.trim(),
          priceCash,
          condition,
        },
        create: {
          sku,
          category: (normalized["หมวดหมู่"] || "").trim(),
          brand: (normalized["ยี่ห้อ"] || "").trim(),
          model: (normalized["รุ่น"] || "").trim(),
          storage: (normalized["ความจุ"] || "").trim(),
          color: (normalized["สี"] || "").trim(),
          name: `${normalized["ยี่ห้อ"] || ""} ${normalized["รุ่น"] || ""} ${
            normalized["ความจุ"] || ""
          } ${normalized["สี"] || ""}`.trim(),
          priceCash,
          condition,
        },
      });

      const planMap = {
        6:
          normalized["ผ่อน6งวดจริง"] ||
          normalized["ผ่อน6งวด"] ||
          normalized["ผ่อน6"],
        9:
          normalized["ผ่อน9งวดจริง"] ||
          normalized["ผ่อน9งวด"] ||
          normalized["ผ่อน9"],
        12:
          normalized["ผ่อน12งวดจริง"] ||
          normalized["ผ่อน12งวด"] ||
          normalized["ผ่อน12"],
      };

      for (const [term, monthlyStr] of Object.entries(planMap)) {
        if (!monthlyStr) continue;

        const monthly =
          parseFloat(monthlyStr.toString().replace(/,/g, "")) || 0;
        const price = monthly * parseInt(term);

        await prisma.productPlan.upsert({
          where: {
            productId_term: {
              productId: product.id,
              term: parseInt(term),
            },
          },
          update: { monthly, price },
          create: {
            productId: product.id,
            term: parseInt(term),
            type: "INSTALLMENT",
            monthly,
            price,
          },
        });
      }

      console.log(`✅ Seeded (${condition}): ${product.name}`);
    } catch (err) {
      console.error("Error seeding row:", err.message);
    }
  }
}

async function main() {
  const dataDir = path.join(__dirname, "../data");

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".csv"));

  for (const file of files) {
    await seedFromFile(path.join(dataDir, file));
  }
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
