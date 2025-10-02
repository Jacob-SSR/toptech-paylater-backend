const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const iconv = require("iconv-lite");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function normalizeKey(key) {
  return key
    .toString()
    .replace(/\r?\n/g, "")
    .replace(/\s+/g, "")
    .replace(/[()]/g, "")
    .toLowerCase()
    .trim();
}

function getValue(obj, keys) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return null;
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
    console.error(`File not found: ${fileName}`);
    return;
  }

  const fileBuffer = fs.readFileSync(filePath);
  const csvData = safeDecode(fileBuffer);

  let parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

  if (!parsed.data.length) {
    console.error(`No data parsed from: ${fileName}`);
    return;
  }

  parsed.data = parsed.data.map((row) =>
    Object.fromEntries(
      Object.entries(row)
        .filter(([k]) => k && k.trim() !== "")
        .map(([k, v]) => [normalizeKey(k), v])
    )
  );

  let condition = "NEW";
  if (/มือ\s*2/i.test(fileName)) {
    condition = "USED";
  }

  console.log(`\n Seeding: ${fileName} (Condition: ${condition})`);
  console.log("Headers (normalized):", Object.keys(parsed.data[0]));

  for (const row of parsed.data) {
    try {
      const brand = (getValue(row, ["ยี่ห้อ", "brand"]) || "").trim();
      const model = (getValue(row, ["รุ่น", "model"]) || "").trim();
      const storage = (getValue(row, ["ความจุ", "storage"]) || "").trim();
      const color = (getValue(row, ["สี", "color"]) || "").trim();
      const category = (getValue(row, ["หมวดหมู่", "category"]) || "").trim();

      let sku = (getValue(row, ["sku", "รหัสสินค้า", "รหัส"]) || "").trim();
      if (!sku) {
        sku = `${brand}-${model}-${storage}-${color}`
          .replace(/\s+/g, "-")
          .toLowerCase();
        console.warn(`No SKU found, generated pseudo-SKU: ${sku}`);
      }

      const priceCash =
        parseFloat(
          (
            getValue(row, [
              "ราคาสด",
              "ราคาสดต้นทุนจริง*ดอกเบี้ย",
              "ราคาสด(ต้นทุนจริง*ดอกเบี้ย)",
              "ราคาสดบาท",
              "cashprice",
            ]) || "0"
          )
            .toString()
            .replace(/,/g, "")
        ) || 0;

      const product = await prisma.product.upsert({
        where: { sku },
        update: {
          category,
          brand,
          model,
          storage,
          color,
          name: `${brand} ${model} ${storage} ${color}`.trim(),
          priceCash,
          condition,
        },
        create: {
          sku,
          category,
          brand,
          model,
          storage,
          color,
          name: `${brand} ${model} ${storage} ${color}`.trim(),
          priceCash,
          condition,
        },
      });

      const planMap = {
        6: getValue(row, [
          "ผ่อน6งวด",
          "ผ่อน6งวดจริง",
          "ผ่อน6",
          "ผ่อน6งวดจริง",
          "ผ่อน6งวด(จริง)",
          "ผ่อน 6 งวด",
          "ผ่อน 6 งวดจริง",
          "ผ่อน 6 งวด(จริง)",
        ]),
        9: getValue(row, [
          "ผ่อน9งวด",
          "ผ่อน9งวดจริง",
          "ผ่อน9",
          "ผ่อน 9 งวด",
          "ผ่อน 9 งวดจริง",
          "ผ่อน 9 งวด(จริง)",
        ]),
        12: getValue(row, [
          "ผ่อน12งวด",
          "ผ่อน12งวดจริง",
          "ผ่อน12",
          "ผ่อน 12 งวด",
          "ผ่อน 12 งวดจริง",
          "ผ่อน 12 งวด(จริง)",
        ]),
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

      console.log(`Seeded (${condition}): ${product.name}`);
    } catch (err) {
      console.error("Error seeding row:", err.message, row);
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
